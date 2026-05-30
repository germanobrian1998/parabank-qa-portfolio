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
// CUENTAS USADAS:
// fromAccount: 13566 (balance: $100) — saldo conocido, suficiente para transfers pequeñas
// toAccount: 13788 (balance: $100) — cuenta separada para evitar self-transfer

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

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

// Setup: obtener cuentas válidas antes de la carga
export function setup() {
  const loginRes = http.get(
    'http://localhost:9090/parabank/services/bank/login/john/demo',
    { headers: { Accept: 'application/json' } }
  );

  if (loginRes.status !== 200) {
    throw new Error(`Setup failed: login returned ${loginRes.status}`);
  }

  // Retornar objeto plano — k6 serializa setup() a JSON
  // Las cuentas están hardcodeadas como fallback seguro
  return {
    fromAccountId: 13566,
    toAccountId: 13788,
  };
}

export default function (data) {
  // k6 pasa el return value de setup() como primer argumento
  // Si data es undefined, usar fallback — evita que el script corra en vacío
  const fromAccountId = (data && data.fromAccountId) || 13566;
  const toAccountId = (data && data.toAccountId) || 13788;

  const url = `http://localhost:9090/parabank/services/bank/transfer?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=1`;

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