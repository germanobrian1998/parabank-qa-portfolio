// tests/accessibility/a11y.spec.ts
//
// Auditoría de accessibility para Parabank — WCAG 2.1 AA.
//
// SCOPE: páginas de mayor riesgo en una aplicación bancaria.
// No auditamos todas las páginas — priorizamos por impacto de negocio:
// login y registro son el único canal de acceso para usuarios con
// discapacidad; transfer y billpay son las operaciones financieras
// principales.
//
// METODOLOGÍA: retrofitting intencional sobre flujos existentes.
// Los tests navegan a cada página como lo haría un usuario real,
// luego auditan el estado DOM con axe-core. No se crean flujos
// artificiales solo para accessibility.
//
// POR QUÉ ACCESSIBILITY IMPORTA EN FINTECH:
// Las personas con discapacidad visual, motora o cognitiva usan el
// homebanking como canal principal — en muchos casos es el único canal
// accesible para ellas. Un banco que no cumple WCAG 2.1 AA no solo
// tiene un problema técnico: tiene un problema legal (ADA, Section 508)
// y excluye activamente a una parte de su base de clientes.
//
// REGRESIÓN DE BASELINE:
// Cada página tiene un threshold de violations documentado en
// docs/accessibility-report.md. Los tests fallan si el número de
// violations supera el baseline — detecta violations nuevos introducidos
// en un cambio sin requerir que el equipo resuelva los históricos primero.
// Baseline medido el 19/06/2026 contra germanobrian1998/parabank:latest:
//   Login: 5 | Register: 5 | Transfer: 6 | Bill Pay: 6 | Accounts: 4

import { test } from '@playwright/test';
import { auditAccessibility, AccessibilityViolation } from '../../src/helpers/assertions';
import { LoginPage } from '../../src/pages/LoginPage';

// Acumulador global para el reporte final
const allViolations: Record<string, AccessibilityViolation[]> = {};

test.describe('Accessibility audit — WCAG 2.1 AA', () => {

  test.afterAll(() => {
    const totalViolations = Object.values(allViolations)
      .reduce((sum, v) => sum + v.length, 0);

    if (totalViolations === 0) {
      console.log('\n[A11Y] ✅ No violations found across all audited pages');
      return;
    }

    console.warn(`\n[A11Y] ━━━ SUMMARY: ${totalViolations} violation(s) across ${Object.keys(allViolations).length} page(s) ━━━`);

    Object.entries(allViolations).forEach(([page, violations]) => {
      if (violations.length > 0) {
        console.warn(`\n  📄 ${page} (${violations.length} violation(s)):`);
        violations.forEach((v) => {
          console.warn(`     • [${v.impact.toUpperCase()}] ${v.id}`);
        });
      }
    });

    console.warn('\n  Full details: docs/accessibility-report.md');
  });

  // ── Login page ─────────────────────────────────────────────────────────────

  test('login page should meet WCAG 2.1 AA', async ({ page }) => {
    // WHY THIS PAGE: el formulario de login es el punto de entrada único
    // para todos los usuarios. Una violation crítica aquí excluye a usuarios
    // con discapacidad de acceder a su cuenta bancaria.

    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    allViolations['Login page'] = await auditAccessibility(page, 'Login page', {
      maxViolations: 5,
      warnOnly: false,
    });
  });

  // ── Register page ──────────────────────────────────────────────────────────

  test('register page should meet WCAG 2.1 AA', async ({ page }) => {
    // WHY THIS PAGE: el registro es el único canal para crear una cuenta nueva.
    // Si no es accesible, los usuarios con discapacidad no pueden convertirse
    // en clientes del banco — barrera de acceso desde el primer contacto.

    await page.goto('/parabank/register.htm');

    allViolations['Register page'] = await auditAccessibility(page, 'Register page', {
      maxViolations: 5,
      warnOnly: false,
    });
  });

  // ── Transfer page (authenticated) ──────────────────────────────────────────

  test('transfer page should meet WCAG 2.1 AA', async ({ page }) => {
    // WHY THIS PAGE: la transferencia es la operación financiera de mayor riesgo.
    // Un usuario con discapacidad visual que no puede identificar correctamente
    // los campos de cuenta origen/destino puede transferir fondos a la cuenta
    // equivocada sin saberlo — consecuencia financiera directa.

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login({ username: 'john', password: 'demo' });
    await page.goto('/parabank/transfer.htm');

    allViolations['Transfer page'] = await auditAccessibility(page, 'Transfer page', {
      maxViolations: 6,
      warnOnly: false,
    });
  });

  // ── Bill Pay page (authenticated) ──────────────────────────────────────────

  test('bill pay page should meet WCAG 2.1 AA', async ({ page }) => {
    // WHY THIS PAGE: los pagos de facturas son operaciones recurrentes.
    // Adultos mayores y personas con baja visión son usuarios frecuentes
    // de homebanking para pagar servicios — este formulario debe ser
    // operable con lector de pantalla y navegación por teclado.

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login({ username: 'john', password: 'demo' });
    await page.goto('/parabank/billpay.htm');

    allViolations['Bill Pay page'] = await auditAccessibility(page, 'Bill Pay page', {
      maxViolations: 6,
      warnOnly: false,
    });
  });

  // ── Accounts overview (authenticated) ──────────────────────────────────────

  test('accounts overview should meet WCAG 2.1 AA', async ({ page }) => {
    // WHY THIS PAGE: la vista de cuentas es la página de aterrizaje post-login.
    // Es la primera pantalla que ve un usuario autenticado — si tiene violations
    // críticos, el usuario con discapacidad queda bloqueado en su sesión.

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login({ username: 'john', password: 'demo' });
    await page.goto('/parabank/overview.htm');

    allViolations['Accounts overview'] = await auditAccessibility(page, 'Accounts overview', {
      maxViolations: 4,
      warnOnly: false,
    });
  });

});