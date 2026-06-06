// tests/api/reversal.api.spec.ts
//
// Tests de reversión de transferencias entre cuentas.
//
// WHY THIS FILE EXISTS:
//
// En sistemas de pagos reales, una "reversión" (reversal) es la operación
// que deshace una transferencia: devuelve el monto al origen y lo retira
// del destino, restaurando ambos saldos al estado previo.
//
// Parabank no expone un endpoint REST de reversa dedicado — es un demo.
// Lo que sí expone es el mismo endpoint de transferencia que puede usarse
// para simular una reversión: si A→B transfirió $X, una reversión es B→A
// por el mismo $X.
//
// LIMITACIÓN EXPLÍCITA (importante para entrevistas):
// Estos tests simulan una reversión como transferencia inversa.
// NO son tests de un endpoint real de reversa. En un sistema de pagos
// de producción, una reversión real implicaría:
//   - Un endpoint dedicado (ej: POST /transactions/{id}/reverse)
//   - Idempotencia garantizada (no se puede revertir dos veces)
//   - Trazabilidad: la reversión referencia la transacción original
//   - Posible ventana de tiempo (reversiones fuera de T+1 pueden rechazarse)
//
// Lo que estos tests sí validan:
//   1. Que una transferencia inversa restaura los saldos correctamente
//   2. Que una "doble reversión" (revertir la reversión) vuelve al estado original
//   3. Que el sistema registra las transacciones de reversión en el historial
//
// Ver tech-discovery-report.md H-007, H-010 para bugs relacionados con
// validaciones en el flujo de transferencias.

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/client/ApiClient';

// ─── Helpers de setup ─────────────────────────────────────────────────────────

/**
 * Autentica a john/demo y retorna cliente + dos cuentas con saldo conocido.
 * Selecciona la cuenta con mayor saldo como origen para garantizar que
 * la transferencia inicial no falle por saldo insuficiente (H-010 existe
 * pero no queremos depender del bug para que el test funcione).
 */
async function setupReversalClient(): Promise<{
  client: ApiClient;
  fromAccountId: number;
  toAccountId: number;
  fromBalanceBefore: number;
  toBalanceBefore: number;
}> {
  const client = new ApiClient();
  await client.init();

  const customer = await client.login('john', 'demo');
  const accounts = await client.getAccountsForCustomer(customer.id);

  if (accounts.length < 2) {
    throw new Error(
      `[Test setup] john/demo necesita al menos 2 cuentas para tests de reversión. Encontradas: ${accounts.length}`,
    );
  }

  // Ordenar por saldo descendente — usar la más rica como origen
  const sorted = [...accounts].sort((a, b) => b.balance - a.balance);
  const fromAccount = sorted[0];
  const toAccount = sorted[1];

  return {
    client,
    fromAccountId: fromAccount.id,
    toAccountId: toAccount.id,
    fromBalanceBefore: fromAccount.balance,
    toBalanceBefore: toAccount.balance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Reversal — transfer reversal via inverse transfer', () => {

  // ── Nota de diseño ──────────────────────────────────────────────────────────
  //
  // IMPORTANTE: estos tests simulan una reversión como transferencia inversa.
  // Parabank no tiene endpoint de reversa dedicado. En un sistema real,
  // una reversión POST /transactions/{id}/reverse garantizaría idempotencia
  // y trazabilidad que una transferencia inversa no puede garantizar.
  // Esta limitación está documentada en el ADR correspondiente.

  test(
    'inverse transfer should restore both account balances @smoke',
    async () => {
      // WHY THIS TEST MATTERS: el contrato mínimo de una reversión es que
      // los saldos vuelvan exactamente al estado previo a la transferencia
      // original. Si los saldos no coinciden (por redondeo, comisiones, o
      // bugs contables), la reversión no es válida.
      //
      // Flujo:
      // 1. Capturar saldos antes
      // 2. Transferir $50 de A → B
      // 3. Verificar que A bajó $50 y B subió $50
      // 4. Revertir: transferir $50 de B → A (inversión)
      // 5. Verificar que ambos saldos volvieron al estado inicial

      const { client, fromAccountId, toAccountId, fromBalanceBefore, toBalanceBefore } =
        await setupReversalClient();

      const transferAmount = 50;

      try {
        // Paso 1: transferencia original A → B
        await client.transfer(fromAccountId, toAccountId, transferAmount);

        const fromAfterTransfer = await client.getAccount(fromAccountId);
        const toAfterTransfer = await client.getAccount(toAccountId);

        expect(
          fromAfterTransfer.balance,
          `Después de transferir $${transferAmount}, la cuenta origen debe tener $${transferAmount} menos`,
        ).toBeCloseTo(fromBalanceBefore - transferAmount, 2);

        expect(
          toAfterTransfer.balance,
          `Después de transferir $${transferAmount}, la cuenta destino debe tener $${transferAmount} más`,
        ).toBeCloseTo(toBalanceBefore + transferAmount, 2);

        // Paso 2: reversión simulada B → A (transferencia inversa)
        // NOTA: esto NO es un endpoint de reversa real. Es una transferencia
        // nueva en dirección opuesta. No referencia la transacción original.
        await client.transfer(toAccountId, fromAccountId, transferAmount);

        const fromAfterReversal = await client.getAccount(fromAccountId);
        const toAfterReversal = await client.getAccount(toAccountId);

        expect(
          fromAfterReversal.balance,
          `Después de la reversión, la cuenta origen debe volver a $${fromBalanceBefore}. ` +
          `Si no coincide, hay pérdida de fondos en el ciclo transferencia→reversión.`,
        ).toBeCloseTo(fromBalanceBefore, 2);

        expect(
          toAfterReversal.balance,
          `Después de la reversión, la cuenta destino debe volver a $${toBalanceBefore}. ` +
          `Si no coincide, hay ganancia espuria de fondos en el ciclo transferencia→reversión.`,
        ).toBeCloseTo(toBalanceBefore, 2);

      } finally {
        await client.dispose();
      }
    },
  );

  test(
    'double reversal should return to original state',
    async () => {
      // WHY THIS TEST MATTERS: una "doble reversión" (revertir la reversión)
      // debe equivaler a no haber hecho nada. Este test detecta acumulación
      // de error numérico o bugs contables que solo aparecen después de
      // múltiples operaciones sobre las mismas cuentas.
      //
      // En sistemas de pagos reales, este patrón también detecta si una
      // reversión es idempotente — revertir dos veces la misma operación
      // no debería ser posible en un sistema bien diseñado.
      //
      // Flujo:
      // A→B $50, luego B→A $50 (reversión 1), luego A→B $50 (reversión 2)
      // Estado final debe ser idéntico al estado tras la transferencia original.

      const { client, fromAccountId, toAccountId, fromBalanceBefore, toBalanceBefore } =
        await setupReversalClient();

      const transferAmount = 50;

      try {
        // Transferencia original
        await client.transfer(fromAccountId, toAccountId, transferAmount);

        // Reversión 1: B → A
        await client.transfer(toAccountId, fromAccountId, transferAmount);

        // Reversión 2: A → B (vuelve al estado post-transferencia original)
        await client.transfer(fromAccountId, toAccountId, transferAmount);

        const fromFinal = await client.getAccount(fromAccountId);
        const toFinal = await client.getAccount(toAccountId);

        // El estado final debe coincidir con el estado post-primera-transferencia
        expect(
          fromFinal.balance,
          `Después de transferencia→reversión→re-transferencia, ` +
          `la cuenta origen debe quedar en $${fromBalanceBefore - transferAmount}`,
        ).toBeCloseTo(fromBalanceBefore - transferAmount, 2);

        expect(
          toFinal.balance,
          `Después de transferencia→reversión→re-transferencia, ` +
          `la cuenta destino debe quedar en $${toBalanceBefore + transferAmount}`,
        ).toBeCloseTo(toBalanceBefore + transferAmount, 2);

      } finally {
        await client.dispose();
      }
    },
  );

  test(
    'reversal transaction should appear in account history',
    async () => {
      // WHY THIS TEST MATTERS: en auditorías financieras, cada operación
      // debe tener trazabilidad completa. Una reversión que restaura saldos
      // pero no genera transacciones en el historial es invisible para
      // auditoría — un sistema de detección de fraude no podría detectar
      // el patrón transferencia→reversión rápida (que puede indicar prueba
      // de acceso a cuentas ajenas).
      //
      // Este test verifica que la transferencia inversa genera al menos
      // una transacción en el historial de ambas cuentas.

      const { client, fromAccountId, toAccountId } = await setupReversalClient();
      const transferAmount = 75;

      try {
        // Capturar cantidad de transacciones antes
        const fromTxBefore = await client.getTransactionsForAccount(fromAccountId);
        const toTxBefore = await client.getTransactionsForAccount(toAccountId);

        // Transferencia original + reversión
        await client.transfer(fromAccountId, toAccountId, transferAmount);
        await client.transfer(toAccountId, fromAccountId, transferAmount);

        // Verificar que el historial creció en ambas cuentas
        const fromTxAfter = await client.getTransactionsForAccount(fromAccountId);
        const toTxAfter = await client.getTransactionsForAccount(toAccountId);

        expect(
          fromTxAfter.length,
          `La cuenta origen debe tener más transacciones después del ciclo transferencia→reversión. ` +
          `Antes: ${fromTxBefore.length}, después: ${fromTxAfter.length}`,
        ).toBeGreaterThan(fromTxBefore.length);

        expect(
          toTxAfter.length,
          `La cuenta destino debe tener más transacciones después del ciclo transferencia→reversión. ` +
          `Antes: ${toTxBefore.length}, después: ${toTxAfter.length}`,
        ).toBeGreaterThan(toTxBefore.length);

      } finally {
        await client.dispose();
      }
    },
  );

});