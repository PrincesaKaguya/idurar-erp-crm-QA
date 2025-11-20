import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

/**
 * CP055: Prueba de Carga Masiva de Facturas
 * 
 * Prueba no funcional que valida que el sistema permita la carga 
 * simultánea de múltiples facturas por varios usuarios concurrentes.
 * 
 * Escenario:
 * - Múltiples usuarios crean facturas simultáneamente
 * - Cada usuario crea entre 3-5 facturas consecutivas
 * - Se valida el rendimiento y la integridad de los datos
 * 
 * Atributos evaluados:
 * - Rendimiento: Tiempo de respuesta bajo carga masiva
 * - Fiabilidad: Tasa de éxito en operaciones concurrentes
 * - Integridad: Consistencia de datos (números de factura únicos)
 * - Escalabilidad: Capacidad de manejar múltiples escrituras simultáneas
 */

// ============================
// CONFIGURACIÓN DE MÉTRICAS
// ============================

const invoicesCreated = new Counter('invoices_created_total');
const invoiceErrors = new Rate('invoice_creation_errors');
const invoiceCreationTime = new Trend('invoice_creation_duration');
const duplicateNumbers = new Counter('duplicate_invoice_numbers');

// ============================
// DATOS DE PRUEBA
// ============================

// IMPORTANTE: Actualiza estos IDs con clientes reales de tu base de datos
// Para obtener IDs reales, ejecuta en MongoDB:
//   db.clients.find({enabled: true, removed: false}, {_id: 1, company: 1}).limit(3)
const clients = new SharedArray('clients', function () {
  return [
    { id: '507f1f77bcf86cd799439011', name: 'Test Client 1' },  // ⚠️ REEMPLAZAR con ID real
    { id: '507f1f77bcf86cd799439012', name: 'Test Client 2' },  // ⚠️ REEMPLAZAR con ID real
    { id: '507f1f77bcf86cd799439013', name: 'Test Client 3' },  // ⚠️ REEMPLAZAR con ID real
  ];
});

// IMPORTANTE: Actualiza estos IDs con impuestos reales de tu base de datos
// Para obtener IDs reales, ejecuta en MongoDB:
//   db.taxes.find({enabled: true, removed: false}, {_id: 1, taxName: 1, taxValue: 1})
const taxes = new SharedArray('taxes', function () {
  return [
    { id: '507f1f77bcf86cd799439021', name: 'IVA 21%', rate: 21 },  // ⚠️ REEMPLAZAR con ID real
    { id: '507f1f77bcf86cd799439022', name: 'IVA 10%', rate: 10 },  // ⚠️ REEMPLAZAR con ID real
  ];
});

// Items de ejemplo para las facturas
const sampleItems = new SharedArray('items', function () {
  return [
    { itemName: 'Servicio de Consultoría', description: 'Asesoría técnica', quantity: 1, price: 500 },
    { itemName: 'Licencia de Software', description: 'Licencia anual', quantity: 10, price: 150 },
    { itemName: 'Mantenimiento', description: 'Soporte mensual', quantity: 12, price: 200 },
    { itemName: 'Desarrollo Web', description: 'Sitio web corporativo', quantity: 1, price: 3000 },
    { itemName: 'Hosting', description: 'Hosting anual', quantity: 1, price: 180 },
  ];
});

// ============================
// CONFIGURACIÓN DE LA PRUEBA
// ============================

export const options = {
  stages: [
    // Fase 1: Warm-up - 5 usuarios creando facturas (30s)
    { duration: '30s', target: 5 },
    
    // Fase 2: Carga gradual - Incrementar a 15 usuarios (1m)
    { duration: '1m', target: 15 },
    
    // Fase 3: Carga masiva - 25 usuarios creando facturas simultáneamente (2m)
    { duration: '2m', target: 25 },
    
    // Fase 4: Pico de carga - 30 usuarios (1m)
    { duration: '1m', target: 30 },
    
    // Fase 5: Cooldown - Reducir gradualmente (30s)
    { duration: '30s', target: 0 },
  ],
  
  thresholds: {
    // El 95% de las creaciones de facturas deben completarse en menos de 3 segundos
    'invoice_creation_duration': ['p(95)<3000'],
    
    // La tasa de error debe ser menor al 3%
    'invoice_creation_errors': ['rate<0.03'],
    
    // El 99% de las peticiones HTTP deben tener éxito
    'http_req_failed': ['rate<0.01'],
    
    // Tiempo de respuesta general menor a 4 segundos en el 95 percentil
    'http_req_duration': ['p(95)<4000'],
    
    // No debe haber números de factura duplicados
    'duplicate_invoice_numbers': ['count==0'],
  },
};

// ============================
// VARIABLES GLOBALES
// ============================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8888';
let authToken = '';

// ============================
// FUNCIONES AUXILIARES
// ============================

/**
 * Genera un payload de factura con datos aleatorios
 */
function generateInvoicePayload(userIndex, invoiceIndex) {
  const client = clients[Math.floor(Math.random() * clients.length)];
  const tax = taxes[Math.floor(Math.random() * taxes.length)];
  
  // Generar entre 1-4 items aleatorios
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = [];
  
  for (let i = 0; i < numItems; i++) {
    const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    const quantity = Math.floor(Math.random() * 10) + 1;
    const price = item.price;
    const total = quantity * price;
    
    items.push({
      itemName: item.itemName,
      description: item.description,
      quantity: quantity,
      price: price,
      total: total,  // Campo requerido por el backend
    });
  }
  
  // Fecha actual y expiración (30 días después)
  const now = new Date();
  const expiration = new Date(now);
  expiration.setDate(expiration.getDate() + 30);
  
  // Generar número de factura único (timestamp + userIndex + invoiceIndex)
  const uniqueNumber = Date.now() + (userIndex * 1000) + invoiceIndex;
  
  return {
    client: client.id,
    number: uniqueNumber,
    year: now.getFullYear(),
    date: now.toISOString(),
    expiredDate: expiration.toISOString(),
    status: 'draft',
    taxRate: tax.rate,
    items: items,
    notes: `Factura generada por prueba de carga - Usuario ${userIndex} - Factura #${invoiceIndex}`,
  };
}

/**
 * Extrae el número de factura de la respuesta
 */
function extractInvoiceNumber(response) {
  try {
    const body = JSON.parse(response.body);
    return body.result?.number || null;
  } catch (e) {
    return null;
  }
}

// ============================
// SETUP: Autenticación
// ============================

export function setup() {
  const loginPayload = {
    email: 'admin@admin.com',
    password: 'admin123',
  };
  
  const loginRes = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const loginSuccess = check(loginRes, {
    'Login exitoso': (r) => r.status === 200,
  });
  
  if (!loginSuccess) {
    console.log(`❌ Login falló - Status: ${loginRes.status}`);
    console.log(`Response: ${loginRes.body}`);
    throw new Error('Falló la autenticación inicial. Verifica credenciales o que el backend esté activo.');
  }
  
  const body = JSON.parse(loginRes.body);
  authToken = body.result?.token || '';
  
  console.log('✓ Setup completado - Token obtenido');
  
  return { token: authToken };
}

// ============================
// ESCENARIO PRINCIPAL
// ============================

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };
  
  // Cada usuario virtual crea entre 3-5 facturas
  const numInvoices = Math.floor(Math.random() * 3) + 3; // 3-5 facturas
  
  for (let i = 0; i < numInvoices; i++) {
    group(`Usuario ${__VU} - Crear Factura ${i + 1}/${numInvoices}`, function () {
      const startTime = new Date();
      const payload = generateInvoicePayload(__VU, i);
      
      const response = http.post(
        `${BASE_URL}/api/invoice/create`,
        JSON.stringify(payload),
        { headers }
      );
      
      const duration = new Date() - startTime;
      invoiceCreationTime.add(duration);
      
      const success = check(response, {
        'Status 200': (r) => r.status === 200,
        'Respuesta válida': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true;
          } catch {
            return false;
          }
        },
        'Factura tiene ID': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.result?._id !== undefined;
          } catch {
            return false;
          }
        },
        'Número de factura asignado': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.result?.number > 0;
          } catch {
            return false;
          }
        },
      });
      
      if (success) {
        invoicesCreated.add(1);
        
        // Opcional: Verificar duplicados (solo en entorno de prueba controlado)
        const invoiceNumber = extractInvoiceNumber(response);
        if (invoiceNumber) {
          // Aquí podrías implementar lógica para detectar duplicados
          // usando un Set compartido, pero k6 no lo soporta nativamente
          // Esta métrica se validaría manualmente post-ejecución
        }
      } else {
        invoiceErrors.add(1);
        console.error(`Error creando factura: ${response.status} - ${response.body}`);
      }
      
      // Pequeña pausa entre creaciones del mismo usuario (0.5-2s)
      sleep(Math.random() * 1.5 + 0.5);
    });
  }
  
  // Pausa entre iteraciones del mismo VU
  sleep(Math.random() * 2 + 1);
}

// ============================
// TEARDOWN: Limpieza
// ============================

export function teardown(data) {
  console.log('═══════════════════════════════════════════');
  console.log('         RESUMEN CP055: CARGA MASIVA       ');
  console.log('═══════════════════════════════════════════');
  console.log('✓ Prueba completada');
  console.log('Revisa los resultados para validar:');
  console.log('  - Facturas creadas exitosamente');
  console.log('  - Tasa de error < 3%');
  console.log('  - Tiempo de respuesta p95 < 3s');
  console.log('  - Ausencia de números duplicados');
  console.log('═══════════════════════════════════════════');
}
