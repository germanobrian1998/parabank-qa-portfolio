// tests/performance/transfer.stress.k6.js
//
// ESCENARIO: stress test del endpoint de transferencia con ramp-up progresivo.
//
// JUSTIFICACIÓN DE THRESHOLDS:
// error rate < 1% — en un sistema financiero, perder más del 1% de
// transacciones bajo carga es inaceptable desde el punto de vista del negocio.
// Cada error HTTP en una transferencia es potencialmente dinero no movido
// sin confirmación al usuario.
//
// JUSTIFICACIÓN DEL RAMP-UP:
// El ramp-up de 1→20 VUs en 1 minuto imita el patrón de carga real:
// los sistemas bancarios no reciben 20 usuarios simultáneos de golpe —
// el tráfico crece gradualmente durante el horario de atención.
//
// RELACIÓN CON BUG H-008:
// El doble submit (H-008) fue confirmado con un solo usuario.
// Este test estresa el endpoint con múltiples usuarios concurrentes
// para detectar si las race conditions se amplifican bajo carga.
// Si el error rate supera el 1%, hay degradación sistémica, no solo
// el bug puntual ya documentado.
//
// SELECCIÓN DE CUENTAS:
// Setup resuelve dinámicamente dos cuentas CHECKING con balance > $100.
// No se hardcodean IDs — el stress test acumula estado en la BD y puede
// agotar el saldo de una cuenta entre corridas, causando 100% error rate
// en la siguiente ejecución (bug confirmado en CI el 30/05/2026).

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';
const USER     = __ENV.PARABANK_USER || 'john';
const PASS     = __ENV.PARABANK_PASS || 'demo';

const transferErrorRate = new Rate('transfer_error_rate');
const transferDuration = new Trend('transfer_duration', true);

export const options = {
  stages: [
    { duration: '20s', target: 5 },   // ramp-up inicial suave
    { duration: '40s', target: 20 },  // carga máxima
    { duration: '20s', target: 0 },   // ramp-down
  ],
  thresholds: {
    // THRESHOLD QUE EL SISTEMA NO CUMPLE — intencional.
    // El sistema acepta transferencias sin validar saldo (H-010).
    // Bajo carga, esto genera transacciones con saldo negativo ilimitado
    // sin ningún error HTTP — el error rate será bajo pero el daño financiero alto.
    // Este threshold documenta que el problema no es de performance sino de lógica.
    transfer_error_rate: ['rate<0.01'],
    transfer_duration: ['p(95)<3000'],
  },
};

// Setup: resolver cuentas dinámicamente antes de la carga.
// Selecciona las dos primeras cuentas CHECKING con balance > $100.
// Si no hay dos cuentas elegibles, el setup falla con mensaje claro
// en lugar de correr el test con cuentas inválidas.
export function setup() {
  const loginRes = http.get(
    `${BASE_URL}/parabank/services/bank/login/${USER}/${PASS}`,
    { headers: { Accept: 'application/json' } }
  );

  if (loginRes.status !== 200) {
    throw new Error(`Setup failed: login returned ${loginRes.status}`);
  }

  const customer = JSON.parse(loginRes.body);

  const accountsRes = http.get(
    `${BASE_URL}/parabank/services/bank/customers/${customer.id}/accounts`,
    { headers: { Accept: 'application/json' } }
  );

  if (accountsRes.status !== 200) {
    throw new Error(`Setup failed: accounts returned ${accountsRes.status}`);
  }

  const accounts = JSON.parse(accountsRes.body);

  // Filtrar cuentas CHECKING con saldo suficiente para absorber
  // ~1500 transferencias de $1 sin agotarse (balance > $100 es suficiente
  // porque H-010 confirma que el servidor no valida saldo — nunca rechaza).
  const eligible = accounts.filter(
    (a) => a.type === 'CHECKING' && a.balance > 100
  );

  if (eligible.length < 2) {
    throw new Error(
      `Setup failed: need at least 2 CHECKING accounts with balance > $100. ` +
      `Found: ${eligible.length}. Re-seed the Docker image before running performance tests.`
    );
  }

  return {
    fromAccountId: eligible[0].id,
    toAccountId: eligible[1].id,
  };
}

export default function (data) {
  const url = `${BASE_URL}/parabank/services/bank/transfer?fromAccountId=${data.fromAccountId}&toAccountId=${data.toAccountId}&amount=1`;

  const res = http.post(url, null, {
    headers: { Accept: 'application/json' },
    tags: { endpoint: 'transfer' },
  });

  transferErrorRate.add(res.status !== 200);
  transferDuration.add(res.timings.duration);

  check(res, {
    'transfer returns 200': (r) => r.status === 200,
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  sleep(0.5);
}