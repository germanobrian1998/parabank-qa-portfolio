# ADR-001: Modelo de abstracción de UI — Page Object Model

**Estado:** Aceptado  
**Fecha:** 2025-06  
**Decisores:** QA Engineer (autor del framework)  
**Revisado por:** (pendiente de peer review)

---

## Contexto

Al iniciar el framework de automation para Parabank, la primera decisión estructural es cómo modelar la interacción con la UI. Esta decisión impacta directamente en la mantenibilidad del código, la curva de aprendizaje para futuros contribuidores, y el costo de actualización cuando la aplicación cambia.

El problema concreto que esta decisión resuelve: los tests necesitan interactuar con elementos del browser (clicks, fills, navigations) sin que esa lógica esté dispersa en cada archivo de test. Necesitamos una abstracción que separe el "qué queremos probar" del "cómo interactuar con la UI para probarlo".

Parabank tiene las siguientes características relevantes para esta decisión:
- 7 páginas con funcionalidad distinta (Login, Register, Accounts, Transfer, BillPay, Loan, Transactions)
- Flujos que cruzan 2-3 páginas (ej: transferencia toca AccountsPage + TransferPage + ConfirmationPage)
- Un solo desarrollador manteniendo el framework
- La UI es tradicional (server-side rendered), sin componentes reutilizables complejos

---

## Opciones consideradas

### Opción A: Page Object Model clásico (POM)

Cada página de la aplicación tiene una clase correspondiente que encapsula sus locators y acciones. Los tests instancian y componen los Page Objects necesarios para el flujo.

```typescript
// Estructura típica
class TransferPage extends BasePage {
  private readonly fromAccount = this.page.getByLabel('From Account');
  private readonly toAccount = this.page.getByLabel('To Account');
  private readonly amount = this.page.getByLabel('Amount');
  private readonly submitButton = this.page.getByRole('button', { name: 'Transfer' });

  async fillTransfer(data: TransferData): Promise<void> {
    await this.fromAccount.selectOption(data.fromAccountId);
    await this.toAccount.selectOption(data.toAccountId);
    await this.amount.fill(data.amount.toString());
  }

  async submit(): Promise<ConfirmationPage> {
    await this.submitButton.click();
    return new ConfirmationPage(this.page);
  }
}
```

**Ventajas:**
- Patrón ampliamente conocido; cualquier QA Engineer puede leer el código sin onboarding
- Mapeo 1:1 con la estructura de la aplicación; fácil de localizar código por página
- Bajo boilerplate; una clase por página es suficiente
- Excelente soporte en documentación de Playwright

**Desventajas:**
- En flujos multi-página, el test tiene que orquestar múltiples objetos y la lógica de composición queda en el test
- Puede volverse una "God Class" si se agrega demasiada lógica en el Page Object

### Opción B: Screenplay Pattern

Los actores realizan tareas usando habilidades. Los objetos de página son reemplazados por Tasks (acciones de alto nivel) y Questions (queries sobre el estado de la UI).

```typescript
// Estructura típica (conceptual)
actor.attemptsTo(
  Transfer.funds({ amount: 500, from: accountA, to: accountB })
);
actor.asks(
  Balance.of(accountA)
);
```

**Ventajas:**
- Muy expresivo para flujos complejos con múltiples actores
- Excelente para teams donde los testers escriben specs y los developers implementan Tasks
- Testeable en aislamiento (Tasks son unidades independientes)

**Desventajas:**
- Curva de aprendizaje significativa; el patrón requiere entender Actors, Tasks, Abilities, y Questions antes de escribir el primer test
- Boilerplate alto: cada acción simple requiere su propia clase
- Valor máximo en equipos con múltiples contribuidores y roles distintos; el overhead no está justificado para un solo desarrollador
- Playwright no tiene soporte nativo; requería una librería externa (Serenity/JS) o implementación custom

### Opción C: Component Objects

En lugar de modelar páginas completas, se modelan componentes reutilizables de UI (Header, NavBar, Form genérico, Modal).

```typescript
// Estructura típica
class TransferForm extends BaseComponent {
  async fill(data: TransferData): Promise<void> { ... }
  async submit(): Promise<void> { ... }
}
// TransferPage es composición de componentes
```

**Ventajas:**
- Alta reutilización cuando la UI tiene componentes compartidos entre páginas
- Granularidad apropiada para aplicaciones con design systems

**Desventajas:**
- Parabank no tiene un design system modular; cada página tiene UI bastante única
- Añade una capa de abstracción sin beneficio proporcional en este caso
- Requiere identificar correctamente los límites de los componentes upfront, lo cual es difícil sin exploración extensa

---

## Decisión

**Se adopta Page Object Model clásico (Opción A)** con las siguientes adaptaciones específicas para Parabank:

1. **BasePage** con manejo de navegación y waitFor encapsulados: todos los Page Objects extienden BasePage para evitar duplicación de lógica de espera y error handling.

2. **Retorno tipado de Page Objects:** los métodos que producen navegación retornan el Page Object de la página destino, habilitando chaining y type safety.

3. **Separación de locators y actions:** los locators se definen como propiedades privadas en el tope de la clase; los métodos de acción usan esas propiedades. Esto facilita actualizar un selector sin tocar la lógica de la acción.

4. **Page Objects no hacen assertions:** toda verificación de negocio ocurre en el test o en custom matchers. El Page Object solo expone estado (getters) y acciones (métodos void o que retornan otro Page Object).

---

## Consecuencias

### Lo que se gana

- **Mantenibilidad inmediata:** un nuevo QA Engineer puede orientarse leyendo el directorio `/src/pages/` sin documentación adicional. El mapa mental "página de la app → archivo TypeScript" es directo.
- **Alineación con Playwright:** el ecosistema de Playwright (testing library, trace viewer, code generation) está optimizado para POM. Las herramientas de debugging muestran el Page Object en el stack trace.
- **Velocidad de implementación:** para un proyecto de portafolio con plazo definido, POM permite empezar a escribir tests significativos en horas, no en días.
- **KPI-3 verificable:** la separación de locators en propiedades privadas hace trivial auditar que un selector vive en exactamente 1 lugar.

### Lo que se sacrifica

- **Expresividad en flujos complejos:** un test de "crear usuario → abrir cuenta → hacer transferencia → verificar historial" requiere instanciar y encadenar 4 Page Objects. Con Screenplay Pattern, eso sería una sola Task de alto nivel. En Parabank, la complejidad actual no justifica ese overhead, pero si los flujos crecieran significativamente, POM mostraría sus limitaciones.
- **Testabilidad de unidades de interacción:** con Screenplay, cada Task es testeable en aislamiento. Con POM, los Page Objects solo se pueden testear integrados con el browser.

### Condición de revisión

Esta decisión se revisará si en la Fase 3 (casos difíciles) se identifican más de 3 flujos que requieran orquestar 4+ Page Objects con lógica condicional entre ellos. En ese caso, se evaluará una migración parcial hacia Component Objects o una capa de "Flow Objects" que encapsulen flujos multi-página.
