import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * CP054: Simulación de 40 Usuarios Concurrentes
 * 
 * Prueba de carga no funcional que evalúa el comportamiento del sistema 
 * ante 40-50 usuarios conectados simultáneamente realizando operaciones 
 * de consulta y registro.
 * 
 * Métricas evaluadas:
 * - Rendimiento (tiempo de respuesta)
 * - Fiabilidad (tasa de errores)
 * - Compatibilidad (concurrencia)
 */

// Configuración de métricas personalizadas
const errorRate = new Rate('errors');

// Configuración de la prueba de carga
export const options = {
  stages: [
    // Fase 1: Ramp-up - Incremento gradual de 0 a 10 usuarios en 30s
    { duration: '30s', target: 10 },
    
    // Fase 2: Carga media - Mantener 20 usuarios por 1 minuto
    { duration: '1m', target: 20 },
    
    // Fase 3: Pico de carga - Incrementar a 40 usuarios por 2 minutos
    { duration: '2m', target: 40 },
    
    // Fase 4: Sobrecarga (opcional) - Pico de 50 usuarios por 1 minuto
    { duration: '1m', target: 50 },
    
    // Fase 5: Ramp-down - Reducir gradualmente a 0 usuarios en 30s
    { duration: '30s', target: 0 },
  ],
  
  // Umbrales de rendimiento aceptable
  thresholds: {
    // 95% de las peticiones deben completarse en menos de 2 segundos
    http_req_duration: ['p(95)<2000'],
    
    // Tasa de error debe ser menor al 5%
    errors: ['rate<0.05'],
    
    // 95% de las peticiones deben tener éxito
    http_req_failed: ['rate<0.05'],
  },
};

// URL base de la aplicación
const BASE_URL = 'http://localhost:8888';

// Credenciales de prueba
const USERNAME = 'admin@demo.com';
const PASSWORD = 'admin123';

/**
 * Función de autenticación
 * Realiza login y obtiene el token de sesión
 */
function authenticate() {
  const loginPayload = JSON.stringify({
    email: USERNAME,
    password: PASSWORD,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/api/login`, loginPayload, params);
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('result') !== undefined,
  }) || errorRate.add(1);

  if (loginRes.status === 200) {
    return loginRes.json('result.token');
  }
  
  return null;
}

/**
 * Operación de consulta: Listar clientes
 */
function listCustomers(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(`${BASE_URL}/api/client/list?page=1&items=10`, params);
  
  check(res, {
    'customers listed': (r) => r.status === 200,
    'response has data': (r) => r.json('result') !== undefined,
  }) || errorRate.add(1);
  
  return res;
}

/**
 * Operación de consulta: Listar facturas
 */
function listInvoices(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(`${BASE_URL}/api/invoice/list?page=1&items=10`, params);
  
  check(res, {
    'invoices listed': (r) => r.status === 200,
    'response has data': (r) => r.json('result') !== undefined,
  }) || errorRate.add(1);
  
  return res;
}

/**
 * Operación de consulta: Listar presupuestos
 */
function listQuotes(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(`${BASE_URL}/api/quote/list?page=1&items=10`, params);
  
  check(res, {
    'quotes listed': (r) => r.status === 200,
    'response has data': (r) => r.json('result') !== undefined,
  }) || errorRate.add(1);
  
  return res;
}

/**
 * Operación de consulta: Dashboard summary
 */
function getDashboardSummary(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const invoiceSummary = http.get(`${BASE_URL}/api/invoice/summary`, params);
  const quoteSummary = http.get(`${BASE_URL}/api/quote/summary`, params);
  const paymentSummary = http.get(`${BASE_URL}/api/payment/summary`, params);
  
  check(invoiceSummary, {
    'invoice summary loaded': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  check(quoteSummary, {
    'quote summary loaded': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  check(paymentSummary, {
    'payment summary loaded': (r) => r.status === 200,
  }) || errorRate.add(1);
}

/**
 * Operación de registro: Crear cliente
 */
function createCustomer(token) {
  const timestamp = Date.now();
  const customerPayload = JSON.stringify({
    type: 'people',
    name: `Load Test Customer ${timestamp}`,
    email: `customer${timestamp}@loadtest.com`,
    phone: `555-${timestamp.toString().slice(-7)}`,
    country: 'United States',
  });

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/client/create`, customerPayload, params);
  
  check(res, {
    'customer created': (r) => r.status === 200,
    'customer has id': (r) => r.json('result._id') !== undefined,
  }) || errorRate.add(1);
  
  return res;
}

/**
 * Función principal del test
 * Se ejecuta por cada usuario virtual (VU) en cada iteración
 */
export default function () {
  // 1. Autenticación
  const token = authenticate();
  
  if (!token) {
    errorRate.add(1);
    return; // Si falla el login, no continuar
  }
  
  sleep(1); // Pausa de 1 segundo entre operaciones
  
  // 2. Operaciones de consulta (70% del tiempo)
  listCustomers(token);
  sleep(1);
  
  listInvoices(token);
  sleep(1);
  
  listQuotes(token);
  sleep(1);
  
  getDashboardSummary(token);
  sleep(1);
  
  // 3. Operación de registro (30% del tiempo)
  // Simular que solo algunos usuarios crean datos
  if (Math.random() < 0.3) {
    createCustomer(token);
    sleep(2);
  }
  
  // Pausa aleatoria entre 2-5 segundos para simular comportamiento humano
  sleep(Math.random() * 3 + 2);
}

/**
 * Función de resumen ejecutada al final de la prueba
 */
export function handleSummary(data) {
  return {
    'performance/cp054-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  
  return `
${indent}✓ CP054 - Load Test Summary
${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${indent}
${indent}Scenarios:
${indent}  • Total iterations: ${data.metrics.iterations.values.count}
${indent}  • Total time: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s
${indent}
${indent}HTTP Metrics:
${indent}  • Requests: ${data.metrics.http_reqs.values.count}
${indent}  • Failed requests: ${data.metrics.http_req_failed.values.rate * 100}%
${indent}  • Request duration (avg): ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  • Request duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  • Request duration (max): ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}
${indent}Virtual Users:
${indent}  • Max concurrent VUs: ${data.metrics.vus_max.values.value}
${indent}  • Active VUs at end: ${data.metrics.vus.values.value}
${indent}
${indent}Errors:
${indent}  • Error rate: ${(data.metrics.errors?.values.rate || 0) * 100}%
${indent}
${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
}
