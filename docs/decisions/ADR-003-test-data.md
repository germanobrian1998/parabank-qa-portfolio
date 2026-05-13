# ADR-003: Estrategia de datos de prueba — Fixtures estáticos vs. Factories dinámicas vs. Setup via API

**Estado:** Aceptado  
**Fecha:** 2025-06  
**Decisores:** QA Engineer (autor del framework)  
**Revisado por:** (pendiente de peer review)

---

## Contexto

Los datos de prueba son frecuentemente el punto más frágil de un framework de automation. Una estrategia incorrecta produce tests que se rompen cuando la base de datos cambia, cuando otro test modifica el estado compartido, o cuando el ambiente se reinicia.

Para Parabank, el problema es concreto: la aplicación persiste usuarios, cuentas, y transacciones en HSQLDB. Cada operación (registro, transferencia, apertura de cuenta) crea entidades persistentes. Los tests necesitan datos en un estado específico — un usuario autenticado con dos cuentas, una con saldo suficiente para transferir — y ese estado debe ser confiable, reproducible, y no interferir con otros tests.

Características del sistema que informan esta decisión:
- HSQLDB se inicializa con datos de seed al arrancar el contenedor Docker (usuario `john / demo` preexiste)
- El ambiente demo público (`parabank.parasoft.com`) es compartido; el estado no es controlable
- La API de Parabank permite crear usuarios, cuentas, y ejecutar operaciones programáticamente
- No hay endpoint de "limpieza" o "reset" de datos individuales (solo reinicio del contenedor completo)
- Los tests se ejecutan en paralelo (Playwright permite ejecución paralela por defecto)

---

## Opciones consideradas

### Opción A: Fixtures estáticos (JSON hardcodeado)

Un conjunto de datos predefinidos en archivos JSON que representan el estado esperado de la base de datos.

```typescript
// fixtures/users.json
{
  "validUser": {
    "username": "john",
    "password": "demo",
    "accountId": "12345",
    "savings": { "accountId": "12346", "balance": 1000 }
  }
}
```

```typescript
// En el test
const { validUser } = await import('../fixtures/users.json');
await loginPage.login(validUser.username, validUser.password);
```

**Ventajas:**
- Implementación inmediata; cero overhead de setup
- Datos predecibles y auditables en code review
- Sin dependencia de endpoints de API para setup

**Desventajas:**
- El usuario `john` en Parabank tiene un estado inicial definido por el seed, pero ese estado cambia si otros tests (u otros usuarios del ambiente demo) realizan operaciones sobre esa cuenta
- En el ambiente dockerizado, el estado es reproducible solo si el contenedor se reinicia entre suites — lo cual hace la suite no apta para ejecución paralela
- Los saldos hardcodeados en JSON se desactualizan cuando cambia el seed de la base de datos
- Tests que asuman `"balance": 1000` son inherentemente frágiles: si un test anterior transfirió dinero de esa cuenta, el test actual fallará aunque el sistema esté correcto

### Opción B: Factories dinámicas (generación en runtime con Faker)

Cada test crea sus propios datos frescos usando una librería de generación (Faker.js), sin asumir estado preexistente.

```typescript
// factories/user.factory.ts
export class UserFactory {
  static build(): UserData {
    return {
      username: faker.internet.userName(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      ssn: faker.string.numeric(9),
      phone: faker.phone.number()
    };
  }
}
```

**Ventajas:**
- Cada test es completamente independiente; no hay dependencia de estado preexistente
- La suite puede correr en paralelo sin conflictos de datos
- Los tests reflejan usuarios reales más fielmente (datos generados varían)

**Desventajas:**
- Cada test que necesita un usuario autenticado debe completar el flujo de registro en la UI o via API — lo cual añade 2-5 segundos por test
- En Parabank demo público, se acumulan miles de usuarios de prueba sin forma de limpiarlos
- Si el flujo de registro tiene un bug, todos los tests que dependan de un usuario fresco fallarán en setup, no en el comportamiento que quieren probar — ruido de diagnosis difícil de separar

### Opción C: Setup via API

El estado de precondición se establece via la API de Parabank, sin usar la UI para setup. El test comienza con el sistema ya en el estado correcto.

```typescript
// fixtures/test.fixture.ts
export const test = base.extend<{
  authenticatedUser: { page: Page; userId: string; accountId: string };
}>({
  authenticatedUser: async ({ browser }, use) => {
    const api = new ParabankApiClient(process.env.BASE_URL!);
    
    // Crear usuario via API (más rápido que UI registration flow)
    const userData = UserFactory.build();
    const { customerId } = await api.register(userData);
    
    // Autenticar y obtener session via API
    await api.login(userData.username, userData.password);
    
    // Crear cuenta con saldo conocido
    const { accountId } = await api.openAccount(customerId, 'CHECKING');
    
    // Depositar saldo inicial via transfer from default account
    await api.transfer({ fromAccountId: SEED_ACCOUNT_ID, toAccountId: accountId, amount: 1000 });
    
    // Crear page autenticado con la sesión del API client
    const context = await browser.newContext({ storageState: api.getStorageState() });
    const page = await context.newPage();
    
    await use({ page, userId: customerId, accountId });
    
    // Cleanup: no es posible eliminar el usuario, pero el contenedor se reinicia entre runs
    await context.close();
  }
});
```

**Ventajas:**
- El setup es más rápido que la UI (no hay rendering, no hay waitFor de elementos)
- Cada test tiene sus propios datos sin interferencia
- Si el flujo de registro via UI tiene un bug, los tests de otros módulos no se ven afectados (el setup usa API)
- El estado es exactamente el que se especifica en el fixture, sin variabilidad

**Desventajas:**
- Requiere que la API de Parabank soporte todas las operaciones de setup necesarias (en Parabank, sí es el caso)
- El API Client debe estar implementado antes de que ningún test de E2E pueda ejecutarse — dependencia de implementación
- Si la API cambia, todos los fixtures se rompen

---

## Decisión

**Se adopta una estrategia híbrida** que asigna cada tipo de datos a la herramienta más apropiada según su naturaleza:

### Datos de configuración → Fixtures estáticos

Datos que son constantes por diseño del sistema y no cambian entre runs:

```typescript
// src/fixtures/config.ts — valores constantes del sistema
export const PARABANK_CONFIG = {
  defaultAccount: { id: '12345', type: 'CHECKING' }, // cuenta seed de john
  loanTypes: ['PERSONAL', 'HOME', 'SMALL_BUSINESS'],
  minLoanAmount: 100,
  maxLoanAmount: 99999,
} as const;
```

Estos valores no generan estado en la DB; son parámetros del sistema que no cambian entre ejecuciones.

### Entidades transaccionales → Factories dinámicas

Datos que representan entidades únicas (usuarios, cuentas) que deben existir independientemente en cada test:

```typescript
// src/factories/user.factory.ts
export class UserFactory {
  static build(overrides?: Partial<UserData>): UserData {
    return {
      username: `qa_${faker.string.alphanumeric(8)}`, // prefijo para identificar datos de test
      password: 'Test@12345', // contraseña fija para simplificar debugging
      firstName: faker.person.firstName(),
      // ... campos restantes
      ...overrides
    };
  }
}
```

El prefijo `qa_` en el username permite identificar datos de test en la DB y facilita auditorías.

### Estado previo de flujos E2E → Setup via API

El estado de precondición (usuario autenticado, cuentas con saldo específico) se establece via API antes de que el test interactúe con la UI:

```typescript
// src/fixtures/test.fixture.ts — fixture extendido de Playwright
export const test = base.extend<Fixtures>({
  // Usuario con dos cuentas y saldo para transferir
  accountWithBalance: async ({ browser }, use) => {
    const api = new ParabankApiClient(baseURL);
    const user = UserFactory.build();
    const { customerId } = await api.register(user);
    await api.login(user.username, user.password);
    const sourceAccount = await api.openAccount(customerId, 'CHECKING');
    const targetAccount = await api.openAccount(customerId, 'SAVINGS');
    // Transferir desde cuenta seed a cuenta de test para tener saldo conocido
    await api.transfer({ from: SEED_ACCOUNT_ID, to: sourceAccount.id, amount: 1000 });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(baseURL);
    // Inyectar cookies de sesión del API client al browser context
    await context.addCookies(api.getSessionCookies());
    
    await use({ page, user, sourceAccount, targetAccount });
    await context.close();
  }
});
```

### Resumen de asignación

| Tipo de dato | Estrategia | Razón |
|-------------|-----------|-------|
| Parámetros del sistema (tipos de cuenta, límites) | Fixture estático (const) | No generan estado; son configuración |
| Credenciales del usuario seed `john/demo` | Fixture estático | Predefinido en el seed de la DB |
| Nuevos usuarios para tests de registro | Factory dinámica | Cada test necesita un usuario único |
| Cuentas con saldo para tests de transferencia | Setup via API | Estado específico controlado sin depender de UI |
| Payees para Bill Pay | Factory dinámica + API setup | Combinación: generar datos y crear el payee via API |
| Datos de solicitud de préstamo | Factory dinámica | Parámetros que varían por caso de prueba |

---

## Consecuencias

### Lo que se gana

- **Independencia entre tests:** cada test de E2E que use el fixture `accountWithBalance` opera sobre cuentas que solo él creó. La ejecución paralela no produce interferencias de estado.
- **Velocidad de setup:** crear un usuario y sus cuentas via API toma ~200-400ms vs. 5-10 segundos via UI registration flow. Con 10 tests que necesitan usuario propio, eso es 50-90 segundos ahorrados por run.
- **Claridad en el punto de falla:** si el flujo de registro UI tiene un bug, solo los tests de `auth.spec.ts` fallan. Los tests de transferencia fallan por razones de transferencia.
- **Auditoría de datos de test:** el prefijo `qa_` en usernames permite identificar registros de test en la DB de forma trivial.

### Lo que se sacrifica

- **Complejidad de implementación inicial:** el API Client y los fixtures compuestos deben estar implementados antes de escribir los primeros tests de E2E. No hay forma de atajar con datos hardcodeados y "mejorar después" sin refactoring significativo.
- **Dependencia de la API para setup:** si la API tiene un bug que afecta el registro o la apertura de cuentas, todos los fixtures que usan setup via API fallarán en precondición. Esto puede hacer que toda la suite parezca rota cuando el problema es localizado.

### Mitigación del riesgo de dependencia en API setup

El fixture base incluye un assertion de precondición explícito:

```typescript
// Verificar que el setup fue exitoso antes de continuar con el test
expect(sourceAccount.balance, 
  'Precondición: la cuenta de origen debe tener saldo >= 1000 para ejecutar tests de transferencia'
).toBeGreaterThanOrEqual(1000);
```

Si el setup falla, el mensaje de error describe el problema de setup, no el problema del test. Esto mantiene la claridad de diagnosis.

### Condición de revisión

Si en la Fase 2 se detecta que el setup via API consume más del 30% del tiempo total de ejecución de un test individual, se evaluará usar el usuario seed (`john/demo`) como punto de partida con cleanup explícito al final del test, aceptando el trade-off de mayor acoplamiento entre tests a cambio de menor overhead de setup.
