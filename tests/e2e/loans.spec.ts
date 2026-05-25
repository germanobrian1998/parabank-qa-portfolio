// tests/e2e/loans.spec.ts
import { test, expect } from '../../src/fixtures';
import { LoanPage } from '../../src/pages/LoanPage';
import { LoanFactory } from '../../src/factories/LoanFactory';

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS DE DISEÑO
//
// • Todos los tests usan el fixture `authenticatedAsJohn` — la sesión ya está
//   activa al empezar cada test y el logout ocurre en el teardown del fixture.
//
// • Los account IDs se obtienen dinámicamente desde el <select> del formulario
//   (LoanPage.getFirstAccountId) — nunca hardcodeados. El Docker puede
//   resetearse y los IDs cambian.
//
// • El servidor procesa préstamos via AJAX con latencia variable.
//   LoanPage.requestLoan() tiene timeout de 30 s para la respuesta.
//
// • Los tests marcados test.fail() documentan bugs confirmados (H-0xx).
//   Siguen corriendo en CI para detectar si el bug se corrige accidentalmente.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Loan Request', () => {

  // ── Happy path ─────────────────────────────────────────────────────────────

  test(
    'should approve a loan with valid amount and sufficient down payment @smoke',
    async ({ authenticatedAsJohn }) => {
      // WHY THIS TEST MATTERS: el flujo principal de generación de ingresos del banco
      // es la aprobación de préstamos. Si un cliente con historial válido no puede
      // obtener un préstamo, el banco pierde negocio y el cliente pierde confianza.

      const { page } = authenticatedAsJohn;
      await page.goto('/parabank/requestloan.htm');

      const loanPage = new LoanPage(page);
      const fromAccountId = await loanPage.getFirstAccountId();
      const loan = LoanFactory.create();

      const result = await loanPage.requestLoan(loan, fromAccountId);

      expect(result.approved, 'El préstamo debería ser aprobado para un cliente con fondos suficientes').toBe(true);
      expect(result.newAccountId, 'La aprobación debe generar un nuevo número de cuenta de préstamo').toBeTruthy();
    }
  );

  test(
    'should create a new loan account upon approval',
    async ({ authenticatedAsJohn }) => {
      // WHY THIS TEST MATTERS: la aprobación no solo es un mensaje — debe crear
      // una cuenta de préstamo real en el sistema. Si el registro falla silenciosamente,
      // el cliente no puede hacer pagos y el banco no puede cobrar.

      const { page } = authenticatedAsJohn;
      await page.goto('/parabank/requestloan.htm');

      const loanPage = new LoanPage(page);
      const fromAccountId = await loanPage.getFirstAccountId();
      const loan = LoanFactory.create();

      const result = await loanPage.requestLoan(loan, fromAccountId);

      expect(result.approved, 'El préstamo debe ser aprobado antes de verificar la cuenta').toBe(true);

      // El ID de la nueva cuenta debe ser numérico y no vacío
      const accountId = result.newAccountId ?? '';
      expect(accountId.length, 'El ID de cuenta del préstamo no debe estar vacío').toBeGreaterThan(0);
      expect(Number(accountId), 'El ID de cuenta del préstamo debe ser un número válido').not.toBeNaN();
    }
  );

  // ── Casos de rechazo esperados ─────────────────────────────────────────────

  test(
    'should deny a loan when requested amount is too high for credit profile',
    async ({ authenticatedAsJohn }) => {
      // WHY THIS TEST MATTERS: el motor de crédito debe rechazar solicitudes que
      // excedan el perfil de riesgo del cliente. Si no lo hace, el banco asume
      // exposición financiera sin respaldo — riesgo regulatorio y de capital.

      const { page } = authenticatedAsJohn;
      await page.goto('/parabank/requestloan.htm');

      const loanPage = new LoanPage(page);
      const fromAccountId = await loanPage.getFirstAccountId();
      const loan = LoanFactory.withHighAmount();

      const result = await loanPage.requestLoan(loan, fromAccountId);

      expect(result.approved, 'El banco no debería aprobar un préstamo que excede el perfil crediticio del cliente').toBe(false);
    }
  );

  test(
    'should deny a loan with zero down payment',
    async ({ authenticatedAsJohn }) => {
      // WHY THIS TEST MATTERS: el pago inicial es el primer mecanismo de
      // reducción de riesgo. Aprobar un préstamo sin down payment elimina esa
      // garantía y expone al banco a pérdida total si el cliente incumple.

      const { page } = authenticatedAsJohn;
      await page.goto('/parabank/requestloan.htm');

      const loanPage = new LoanPage(page);
      const fromAccountId = await loanPage.getFirstAccountId();
      const loan = LoanFactory.withZeroDownPayment();

      const result = await loanPage.requestLoan(loan, fromAccountId);

      expect(result.approved, 'Un préstamo sin pago inicial no debería ser aprobado').toBe(false);
    }
  );

  // ── Bugs documentados ──────────────────────────────────────────────────────

  test.fail(
    true,
    'H-015: Server accepts loan request with negative amount — known critical bug',
  );
  test(
    'should reject a loan request with a negative amount [BUG H-015]',
    async ({ authenticatedAsJohn }) => {
      // WHY THIS TEST MATTERS: un monto negativo en una solicitud de préstamo
      // podría resultar en que el banco le "pague" al cliente en lugar de
      // prestarle dinero, creando una transferencia no autorizada de fondos.
      // Consistente con H-007 (montos negativos en transfers/billpay).

      const { page } = authenticatedAsJohn;
      await page.goto('/parabank/requestloan.htm');

      const loanPage = new LoanPage(page);
      const fromAccountId = await loanPage.getFirstAccountId();
      const loan = LoanFactory.withNegativeAmount();

      const result = await loanPage.requestLoan(loan, fromAccountId);

      expect(result.approved, 'El servidor no debería aprobar un préstamo con monto negativo').toBe(false);
    }
  );

});