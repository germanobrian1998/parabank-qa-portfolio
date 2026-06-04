// tests/performance/login.baseline.k6.js
//
// ESCENARIO: baseline de autenticación bajo carga moderada.
//
// JUSTIFICACIÓN DE THRESHOLDS:
// p95 < 2000ms — SLA bancario estándar para autenticación.
// NIST SP 800-63B recomienda que los flujos de autenticación respondan
// en menos de 2 segundos para no degradar la experiencia del usuario.
// Este threshold es deliberadamente conservador para una app demo en Docker.
//
// JUSTIFICACIÓN DE CARGA:
// 10 VUs durante 30s simula el pico de login matutino en una sucursal pequeña.
// No es stress test — es medición de baseline para tener un número de referencia
// antes de cualquier cambio en el sistema.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9090';
const USER     = __ENV.PARABANK_USER || 'john';
const PASS     = __ENV.PARABANK_PASS || 'demo';

const loginDuration = new Trend('login_duration', true);
const loginErrorRate = new Rate('login_error_rate');

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    // Criterio de aceptación: 95% de los logins responden en menos de 2 segundos
    login_duration: ['p(95)<2000'],
    // Criterio de aceptación: menos del 1% de errores HTTP
    login_error_rate: ['rate<0.01'],
    // Criterio de aceptación: el threshold nativo de k6 como backup
    http_req_duration: ['p(99)<3000'],
  },
};

export default function () {
  const res = http.get(
    `${BASE_URL}/parabank/services/bank/login/${USER}/${PASS}`,
    {
      headers: { Accept: 'application/json' },
      tags: { endpoint: 'login' },
    }
  );

  loginDuration.add(res.timings.duration);
  loginErrorRate.add(res.status !== 200);

  check(res, {
    'login returns 200': (r) => r.status === 200,
    'response contains customerId': (r) => {
      try {
        return typeof JSON.parse(r.body).id === 'number';
      } catch {
        return false;
      }
    },
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}