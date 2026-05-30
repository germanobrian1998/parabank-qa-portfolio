# Accessibility Report — Parabank

**Fecha de auditoría:** 30/05/2026  
**Herramienta:** axe-core 4.11 via @axe-core/playwright  
**Estándar:** WCAG 2.1 nivel AA  
**Páginas auditadas:** 5  
**Total de violations:** 26  
**Tests:** `tests/accessibility/a11y.spec.ts` — 5/5 passed

---

## Por qué accessibility importa en una aplicación bancaria

Las personas con discapacidad visual, motora o cognitiva utilizan el homebanking
como canal principal de acceso a sus finanzas — en muchos casos es el único canal
disponible para ellas. Una sucursal física puede ser inaccesible físicamente;
el homebanking debería ser el canal alternativo universal.

Un banco que no cumple WCAG 2.1 AA tiene tres problemas concretos:

1. **Legal:** ADA (Americans with Disabilities Act) y Section 508 en EEUU,
   Directiva de Accesibilidad Web en la UE, y legislaciones equivalentes
   en la mayoría de los países con regulación fintech.

2. **Financiero:** excluye activamente a un segmento de clientes. Según la OMS,
   el 15% de la población mundial tiene alguna discapacidad.

3. **Reputacional:** los casos de demandas por accessibility en bancos son
   públicos y frecuentes — Wells Fargo, Bank of America y otros han enfrentado
   litigios específicamente por homebanking inaccesible.

---

## Resumen de violations por página

| Página | CRITICAL | SERIOUS | Total |
|---|---|---|---|
| Login | 2 | 3 | 5 |
| Register | 2 | 3 | 5 |
| Transfer | 3 | 3 | 6 |
| Bill Pay | 3 | 3 | 6 |
| Accounts Overview | 1 | 3 | 4 |
| **Total** | **11** | **15** | **26** |

---

## Violations detalladas con impacto de negocio

### A11Y-001 — `label` (CRITICAL) — presente en: Login, Register, Transfer, Bill Pay

**Descripción técnica:** los campos de formulario no tienen elementos `<label>`
asociados programáticamente. Los campos usan texto visual adyacente (`<b>`) pero
sin atributo `for` que lo vincule al input.

**Elementos afectados:**
- Login: `<input name="username">`, `<input name="password">`
- Register: todos los campos del formulario (13 inputs)
- Transfer: `<input id="amount">`
- Bill Pay: todos los campos del formulario de pago (9 inputs)

**Impacto de negocio:** un lector de pantalla (NVDA, JAWS, VoiceOver) anuncia
estos campos como "edit text" sin contexto — el usuario no sabe si está
completando su nombre, su número de cuenta o su SSN. En el formulario de
transferencia, un usuario ciego podría ingresar el monto en el campo equivocado
sin saberlo, resultando en una transferencia incorrecta. **Esta es la violation
de mayor riesgo financiero directo.**

**Fix requerido:** agregar `<label for="fieldId">` o `aria-label` a cada input.

---

### A11Y-002 — `select-name` (CRITICAL) — presente en: Transfer, Bill Pay

**Descripción técnica:** los elementos `<select>` de selección de cuenta no tienen
nombre accesible. Ni `<label>`, ni `aria-label`, ni `aria-labelledby`.

**Elementos afectados:**
- Transfer: `<select id="fromAccountId">`, `<select id="toAccountId">`
- Bill Pay: `<select name="fromAccountId">`

**Impacto de negocio:** en la página de transferencia, un usuario con lector de
pantalla escucha "combo box" dos veces sin saber cuál es la cuenta origen y cuál
la destino. Seleccionar las cuentas en orden inverso transfiere dinero en la
dirección opuesta a la deseada. En Bill Pay, el usuario no puede identificar
de qué cuenta se debitará el pago.

**Fix requerido:** `<label for="fromAccountId">From account</label>` o
`aria-label="From account"` en cada select.

---

### A11Y-003 — `image-alt` (CRITICAL) — presente en: todas las páginas

**Descripción técnica:** una imagen de navegación (`clear.gif`, 56×42px)
usada como enlace al panel de administración no tiene atributo `alt`.

**Elemento afectado:**
```html
<a href="admin.htm">
  <img src="images/clear.gif" width="56" height="42" border="0" class="admin">
</a>
```

**Impacto de negocio:** el lector de pantalla anuncia el enlace usando la URL
de la imagen ("clear.gif") o lo omite completamente dependiendo del navegador.
El panel de administración es inaccesible por teclado con semántica correcta.
Menor impacto para clientes finales; alto impacto para operadores del banco
con discapacidad.

**Fix requerido:** `alt="Admin panel"` en el `<img>`, o `aria-label` en el `<a>`.

---

### A11Y-004 — `html-has-lang` (SERIOUS) — presente en: todas las páginas

**Descripción técnica:** el elemento `<html>` no tiene atributo `lang`.

**Impacto de negocio:** los lectores de pantalla usan el atributo `lang` para
seleccionar el motor de síntesis de voz correcto. Sin él, un usuario con lector
de pantalla en español puede escuchar el contenido en inglés pronunciado con
fonética española — ininteligible. Para usuarios con baja visión que usan
traducción automática del navegador, la ausencia de `lang` puede causar
traducción incorrecta de números de cuenta o montos.

**Fix requerido:** `<html lang="en">` en el template base de la aplicación.
Un cambio de una línea que afecta todas las páginas.

---

### A11Y-005 — `color-contrast` (SERIOUS) — presente en: todas las páginas

**Descripción técnica:** múltiples elementos de texto no cumplen el ratio de
contraste mínimo de 4.5:1 requerido por WCAG 2.1 AA para texto normal.

**Elementos afectados (muestra):**
- `<p class="caption">Experience the difference</p>` — texto decorativo del header
- Etiquetas de formulario en Register y Bill Pay (`<b>First Name:</b>`, etc.)
- Texto del footer (`Visit us at:`)

**Impacto de negocio:** usuarios con baja visión, daltonismo o que usan el
sistema en condiciones de luz ambiental intensa (móvil al sol) no pueden
leer las etiquetas de los formularios. Las etiquetas de campos como
"Account #" y "Verify Account #" en Bill Pay son particularmente críticas —
confundirlas resulta en pagos a cuentas incorrectas.

**Fix requerido:** aumentar el contraste de los estilos CSS afectados.
Las etiquetas de formulario (`<b>`) son especialmente urgentes porque
afectan la operabilidad directa de transacciones financieras.

---

### A11Y-006 — `link-name` (SERIOUS) — presente en: todas las páginas

**Descripción técnica:** el enlace al panel de administración no tiene texto
discernible. El `<a>` contiene solo una imagen sin `alt`.

**Impacto de negocio:** idéntico a A11Y-003 — el enlace es el mismo elemento.
Esta violation y A11Y-003 son dos reglas axe que detectan el mismo problema
desde perspectivas distintas (imagen sin alt + enlace sin texto).

---

## Patrón sistémico identificado

Las violations no son errores aislados — revelan un patrón de diseño
consistente en toda la aplicación:

1. **Etiquetas visuales con `<b>` en lugar de `<label>`:** Parabank usa texto
   en negrita adyacente a los inputs como etiqueta visual, pero sin asociación
   programática. Este patrón se repite en todos los formularios.

2. **Ausencia de `lang` global:** un cambio de una línea en el template base
   resolvería esta violation en todas las páginas simultáneamente.

3. **Imagen de navegación sin `alt`:** el mismo `clear.gif` se usa como enlace
   en todas las páginas autenticadas y no autenticadas.

Estos tres patrones sugieren que la accesibilidad no fue considerada durante
el diseño inicial de la aplicación. No son bugs de implementación — son
decisiones de diseño que requieren refactoring sistemático, no parches puntuales.

---

## Priorización de fixes

| Prioridad | Violation | Páginas | Esfuerzo de fix | Impacto |
|---|---|---|---|---|
| 🔴 P1 | `label` en Transfer y Bill Pay | Transfer, Bill Pay | Bajo — agregar `for`/`aria-label` | Previene transferencias a cuentas incorrectas |
| 🔴 P1 | `select-name` en Transfer | Transfer | Bajo — agregar `aria-label` | Previene confusión origen/destino en transferencias |
| 🟠 P2 | `html-has-lang` | Todas | Mínimo — 1 línea en template | Habilita síntesis de voz correcta |
| 🟠 P2 | `label` en Login y Register | Login, Register | Bajo — agregar `for` | Habilita acceso y registro para usuarios con lector de pantalla |
| 🟡 P3 | `color-contrast` en etiquetas de formulario | Register, Bill Pay | Medio — cambios de CSS | Mejora legibilidad bajo baja visión |
| 🟡 P3 | `image-alt` + `link-name` | Todas | Bajo — agregar `alt` | Mejora navegación por teclado al panel admin |

---

## Metodología y limitaciones

**Metodología:** auditoría automatizada con axe-core sobre el DOM renderizado.
Los tests navegan cada página como un usuario real (incluyendo autenticación
donde es necesario) y auditan el estado final del DOM.

**Limitaciones de la auditoría automatizada:**
- axe-core detecta aproximadamente el 30-40% de las violations de WCAG —
  las violations que requieren juicio humano (orden de foco, flujo de lectura,
  comprensión cognitiva) no son detectables automáticamente.
- No se auditó la navegación por teclado (Tab order) ni el comportamiento
  con lectores de pantalla reales (NVDA, JAWS, VoiceOver).
- No se evaluó la accesibilidad de los mensajes de error dinámicos
  (jQuery show/hide) — requiere auditoría manual con lector de pantalla activo.

**Complemento recomendado:** una sesión de 30 minutos con NVDA + Firefox
revelaría violations adicionales de flujo de navegación que axe-core no detecta.