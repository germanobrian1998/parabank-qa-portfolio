# ADR-002: Estrategia de especificación de tests — Playwright nativo vs. BDD con Cucumber

**Estado:** Aceptado  
**Fecha:** 2025-06  
**Decisores:** QA Engineer (autor del framework)  
**Revisado por:** (pendiente de peer review)

---

## Contexto

Una decisión que define el "lenguaje" del framework: ¿cómo se expresan los escenarios de prueba? Esta elección impacta en quién puede leer los tests, qué overhead tiene el framework, y qué herramientas de Playwright están disponibles.

El contexto específico de este proyecto:
- Es un portfolio individual, sin equipo de producto ni business analysts como audiencia de los tests
- El sistema bajo prueba (Parabank) tiene una documentación funcional implícita en su UI, no en Gherkin files
- El stack base ya define TypeScript + Playwright; cualquier adición de BDD es una capa sobre eso

La pregunta que esta decisión responde: ¿qué se gana con Gherkin en este contexto específico que no se pueda lograr con código TypeScript bien nombrado?

---

## Opciones consideradas

### Opción A: BDD con Cucumber + Gherkin

Escenarios escritos en lenguaje natural en archivos `.feature`, con step definitions en TypeScript que mapean cada línea Gherkin a código Playwright.

```gherkin
# transfer.feature
Feature: Transferencia entre cuentas
  Como cliente de Parabank
  Quiero transferir dinero entre mis cuentas
  Para gestionar mi liquidez

  Scenario: Transferencia exitosa con saldo suficiente
    Given que tengo una cuenta con saldo de $1000
    And que tengo una cuenta destino activa
    When transfiero $500 desde la cuenta origen
    Then el saldo de la cuenta origen debe ser $500
    And la transferencia debe aparecer en el historial
```

```typescript
// step-definitions/transfer.steps.ts
Given('que tengo una cuenta con saldo de ${int}', async (amount) => {
  // setup via API
});
When('transfiero ${int} desde la cuenta origen', async (amount) => {
  // interacción UI via Page Object
});
Then('el saldo de la cuenta origen debe ser ${int}', async (expected) => {
  // assertion
});
```

**Ventajas:**
- Los `.feature` files son legibles por stakeholders no técnicos (Product Owners, BAs)
- Separa la especificación (Gherkin) de la implementación (step definitions)
- Los escenarios sirven como documentación viva si alguien del negocio los valida
- Framework agnóstico: los `.feature` files son portables entre implementaciones

**Desventajas:**
- La separación entre Gherkin y step definitions introduce una capa de indirección: para entender qué hace un test, hay que leer el `.feature` Y el step definition correspondiente
- Las step definitions tienden a ser genéricas para ser reutilizables, lo que las hace más complejas de mantener
- El ecosistema Cucumber para TypeScript/Playwright está menos maduro que el soporte nativo; herramientas como Trace Viewer y el Reporter de Playwright no integran fluidamente con Cucumber steps
- El valor central de Gherkin — que stakeholders no técnicos lean y validen los escenarios — no se realiza en un portfolio individual donde la audiencia son otros ingenieros
- En la práctica, los `.feature` files se vuelven documentación que nadie mantiene ni lee

### Opción B: Playwright nativo con describe/test y nombres descriptivos

Tests escritos directamente en TypeScript usando la API nativa de Playwright, con `test.describe` y nombres de test que expresan el comportamiento esperado en lenguaje de negocio.

```typescript
// transfers.spec.ts
test.describe('Transferencia entre cuentas', () => {
  test.describe('con saldo suficiente', () => {
    test('debería deducir el monto de la cuenta origen', async ({ transferPage, apiClient }) => {
      // Arrange: crear cuenta con saldo conocido via API
      const { sourceAccount } = await apiClient.setupAccountWithBalance(1000);
      
      // Act: ejecutar transferencia via UI
      await transferPage.transfer({
        from: sourceAccount.id,
        to: targetAccount.id,
        amount: 500
      });
      
      // Assert: verificar saldo resultante
      await expect(transferPage).toShowConfirmation();
      const updatedBalance = await apiClient.getBalance(sourceAccount.id);
      expect(updatedBalance).toBe(500);
    });
  });

  test.describe('con saldo insuficiente', () => {
    test('debería mostrar error de fondos insuficientes sin procesar la transferencia', async () => {
      // ...
    });
  });
});
```

**Ventajas:**
- Integración nativa con todas las herramientas de Playwright: Trace Viewer muestra el nombre del test directamente, el Reporter HTML organiza los tests por describe blocks, el codegen genera código en este formato
- Un solo archivo para leer: el test es su propia especificación cuando tiene buenos nombres
- TypeScript completo: el IDE autocompletea, el compilador detecta errores, el refactoring es seguro
- La estructura `describe > describe > test` es suficientemente expresiva para comunicar contexto y escenario
- Sin overhead de mantenimiento de step definitions

**Desventajas:**
- Los tests no son legibles por alguien sin conocimiento de TypeScript; si en el futuro el equipo incluye BAs que quieran validar escenarios, sería necesaria una migración parcial
- La legibilidad depende de la disciplina del autor en los nombres; un test mal nombrado es opaco

---

## Decisión

**Se adopta Playwright nativo (Opción B)** con las siguientes convenciones de nomenclatura obligatorias:

### Convención de nombres

```typescript
test.describe('[Módulo]', () => {
  test.describe('[contexto o precondición]', () => {
    test('debería [comportamiento esperado observable]', async () => {
      // Arrange
      // Act
      // Assert — siempre las tres secciones, siempre con ese comentario
    });
  });
});
```

El nombre del test debe poder leerse como una oración en español que tenga sentido para alguien del negocio:  
✅ `"Transferencia entre cuentas > con saldo insuficiente > debería mostrar error sin procesar la operación"`  
❌ `"transfer > negative case > fails"`

### Comentario de intención obligatorio

Cada test tiene un comentario en la primera línea del body que explica por qué ese caso importa:

```typescript
test('debería rechazar la transferencia si el monto supera el saldo disponible', async () => {
  // PORQUÉ: en aplicaciones bancarias, procesar una transferencia sin fondos suficientes
  // puede resultar en sobregiro no autorizado. Este caso verifica que el servidor
  // rechaza la operación, independientemente de si el cliente la permite o no.
});
```

---

## Consecuencias

### Lo que se gana

- **Feedback loop completo de Playwright:** el Trace Viewer, el HTML Reporter, y el modo UI de Playwright funcionan sin configuración adicional. Los tests fallidos muestran screenshots, videos, y el stack trace completo alineado con los test steps.
- **TypeScript end-to-end:** el compilador valida que los Page Objects existen, que los métodos tienen la firma correcta, y que los tipos de datos son compatibles. No hay runtime errors por step definitions mal mapeadas.
- **Costo de onboarding bajo:** cualquier developer o QA Engineer que conozca Playwright puede contribuir sin aprender la sintaxis Gherkin ni el modelo mental de step definitions.
- **Ausencia de deuda de mantenimiento de Gherkin:** no hay `.feature` files que se desincronicen de la implementación.

### Lo que se sacrifica

- **Legibilidad para stakeholders no técnicos:** si en el futuro este framework evoluciona hacia un contexto donde Product Owners quieran leer y validar los escenarios, sería necesario evaluar BDD. La decisión no es irreversible, pero una migración tendría costo.
- **Separación formal de especificación e implementación:** con Gherkin, la especificación puede existir antes que el código (Specification by Example). Con Playwright nativo, el test es especificación e implementación al mismo tiempo.

### Condición de revisión

Esta decisión se revisará si el proyecto evoluciona hacia un contexto de equipo donde:
- Existe un equipo de producto que quiera revisar y aprobar los escenarios
- Se adopta una metodología de "Three Amigos" (QA + Dev + BA) para definir criterios de aceptación
- Más de 30% de los tests requieren parametrización compleja que Scenario Outline de Gherkin manejaría mejor que `test.each` de Playwright

En el contexto actual de portfolio individual, ninguna de esas condiciones se cumple.
