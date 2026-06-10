// tests/performance/accounts.soak.k6.js
//
// ESCENARIO: soak test del endpoint de lectura de cuentas durante 2 minutos.
//
// JUSTIFICACIÓN DE THRESHOLDS:
// p99 < 3000ms — los endpoints de lectura son los más golpeados en producción.
// En sistemas bancarios, la página de "mis cuentas" se consulta en cada login,
// en cada operación y en polling de background en apps móviles.
// Un p99 de 3 segundos es el límite antes de que el usuario perciba degradación.
//
// JUSTIFICACIÓN DEL SOAK:
// A diferencia del stress test, el soak no busca el pico máximo sino
// detectar degradación sostenida — memory leaks, connection pool exhaustion,
// o acumulación de estado en el servidor a lo largo del tiempo.
// 2 minutos es suficiente para detectar tendencias en una app demo.
// En producción real, un soak test dura 24-72 horas.
//
// BASELINE MEDIDO (30/05/2026, Docker local):
// Medir con `k6 run tests/performance/accounts.soak.k6.js` antes de
// cualquier cambio para establecer el número de referencia.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';
const USER     = __ENV.PARABANK_USER || 'john';
const PASS     = __ENV.PARABANK_PASS || 'demo';

const readDuration = new Trend('accounts_read_duration', true);
const readErrorRate = new Rate('accounts_read_error_rate');

export const options = {
  vus: 5,
  duration: '2m',
  thresholds: {
    accounts_read_duration: ['p(99)<3000'],
    accounts_read_error_rate: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
  ext: {
    loadimpact: {
      projectID: 7789507,
      name: 'Parabank — Accounts Soak Test',
    },
  },
};

export function setup() {
  const loginRes = http.get(
    `${BASE_URL}/parabank/services/bank/login/${USER}/${PASS}`,
    { headers: { Accept: 'application/json' } }
  );

  const customer = JSON.parse(loginRes.body);
  return { customerId: customer.id };
}

export default function (data) {
  const res = http.get(
    `${BASE_URL}/parabank/services/bank/customers/${data.customerId}/accounts`,
    {
      headers: { Accept: 'application/json' },
      tags: { endpoint: 'accounts_read' },
    }
  );

  readDuration.add(res.timings.duration);
  readErrorRate.add(res.status !== 200);

  check(res, {
    'accounts returns 200': (r) => r.status === 200,
    'response is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  sleep(1);
}