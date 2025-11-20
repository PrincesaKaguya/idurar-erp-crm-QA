/**
 * Script para generar 1000+ clientes de prueba para CP056
 * 
 * Este script crea clientes ficticios en la base de datos
 * para poder realizar pruebas de rendimiento de renderizado
 * de tablas con datasets grandes.
 * 
 * Uso:
 *   node generate-test-data.js [cantidad]
 * 
 * Ejemplo:
 *   node generate-test-data.js 1500
 */

const axios = require('axios');

// ==============================================================================
// CONFIGURACIÓN
// ==============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';
const API_URL = `${BASE_URL}/api`;

// Credenciales de administrador (ajustar según tu configuración)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Número de clientes a generar
const DEFAULT_CLIENT_COUNT = 3000;
const CLIENT_COUNT = parseInt(process.argv[2]) || DEFAULT_CLIENT_COUNT;

// Configuración de concurrencia
const CONCURRENT_REQUESTS = 10; // Número de clientes a crear en paralelo

// ==============================================================================
// DATOS DE EJEMPLO
// ==============================================================================

const COMPANY_NAMES = [
  'Tech Solutions', 'Global Industries', 'Digital Innovations', 'Smart Systems',
  'Future Enterprises', 'Prime Ventures', 'Apex Corporation', 'Elite Services',
  'Advanced Technologies', 'Innovative Labs', 'Strategic Partners', 'Dynamic Solutions',
  'Next Generation', 'Quantum Systems', 'Integrated Networks', 'Progressive Group',
  'Optimal Consulting', 'Precision Engineering', 'Reliable Services', 'Superior Products',
];

const COMPANY_TYPES = [
  'Corp', 'Inc', 'LLC', 'Ltd', 'Group', 'Co', 'Solutions', 'Services',
  'Technologies', 'Systems', 'Industries', 'Enterprises', 'Partners',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
  'Seattle', 'Denver', 'Boston', 'Miami', 'Atlanta', 'Portland', 'Las Vegas',
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Spain', 'Italy', 'Australia', 'Japan', 'Brazil', 'Mexico',
];

// ==============================================================================
// FUNCIONES AUXILIARES
// ==============================================================================

/**
 * Genera un nombre de compañía aleatorio
 */
function generateCompanyName(index) {
  const prefix = COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)];
  const suffix = COMPANY_TYPES[Math.floor(Math.random() * COMPANY_TYPES.length)];
  return `${prefix} ${suffix} #${index}`;
}

/**
 * Genera un email aleatorio basado en el nombre de la compañía
 */
function generateEmail(companyName) {
  const sanitized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `contact@${sanitized}.com`;
}

/**
 * Genera un número de teléfono aleatorio
 */
function generatePhone() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `+1-${areaCode}-${prefix}-${lineNumber}`;
}

/**
 * Genera un cliente ficticio
 */
function generateClient(index) {
  const companyName = generateCompanyName(index);
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  
  return {
    enabled: true,
    removed: false,
    name: companyName,
    surname: '',
    birthday: null,
    birthplace: '',
    gender: '',
    email: generateEmail(companyName),
    phone: generatePhone(),
    address: `${Math.floor(Math.random() * 9999) + 1} Main Street`,
    state: city,
    country: country,
    zipcode: String(Math.floor(Math.random() * 90000) + 10000),
    website: `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    notes: `Test client generated for CP056 performance testing - #${index}`,
  };
}

/**
 * Divide un array en chunks de tamaño específico
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retraso asíncrono
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==============================================================================
// FUNCIONES PRINCIPALES
// ==============================================================================

/**
 * Autenticación y obtención de token
 */
async function login() {
  console.log('🔐 Autenticando...');
  
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.data.success && response.data.result) {
      console.log('✅ Autenticación exitosa');
      return response.data.result.token || response.data.result;
    } else {
      throw new Error('Respuesta de login inválida');
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Crea un cliente en el backend
 */
async function createClient(clientData, token) {
  try {
    const response = await axios.post(
      `${API_URL}/client/create`,
      clientData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      return { success: true, data: response.data.result };
    } else {
      return { success: false, error: 'Respuesta inválida del servidor' };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Crea múltiples clientes en paralelo
 */
async function createClientsInBatch(clients, token, batchNumber, totalBatches) {
  console.log(`\n📦 Procesando lote ${batchNumber}/${totalBatches} (${clients.length} clientes)...`);
  
  const promises = clients.map((client) => createClient(client, token));
  const results = await Promise.all(promises);
  
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`  ✅ Exitosos: ${successCount}`);
  if (failureCount > 0) {
    console.log(`  ❌ Fallidos: ${failureCount}`);
  }
  
  return { successCount, failureCount };
}

/**
 * Función principal
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 GENERADOR DE DATOS DE PRUEBA - CP056');
  console.log('='.repeat(80));
  console.log(`\n📋 Configuración:`);
  console.log(`  • Backend URL: ${BASE_URL}`);
  console.log(`  • Admin Email: ${ADMIN_EMAIL}`);
  console.log(`  • Clientes a generar: ${CLIENT_COUNT}`);
  console.log(`  • Concurrencia: ${CONCURRENT_REQUESTS} requests paralelos`);
  console.log('');

  try {
    // 1. Autenticarse
    const token = await login();

    // 2. Generar datos de clientes
    console.log(`\n🏭 Generando ${CLIENT_COUNT} clientes ficticios...`);
    const clients = [];
    for (let i = 1; i <= CLIENT_COUNT; i++) {
      clients.push(generateClient(i));
    }
    console.log(`✅ ${clients.length} clientes generados en memoria`);

    // 3. Dividir en lotes
    const batches = chunkArray(clients, CONCURRENT_REQUESTS);
    console.log(`\n📦 Divididos en ${batches.length} lotes de ${CONCURRENT_REQUESTS} clientes`);

    // 4. Crear clientes en lotes
    const startTime = Date.now();
    let totalSuccess = 0;
    let totalFailures = 0;

    for (let i = 0; i < batches.length; i++) {
      const { successCount, failureCount } = await createClientsInBatch(
        batches[i],
        token,
        i + 1,
        batches.length
      );
      
      totalSuccess += successCount;
      totalFailures += failureCount;

      // Pequeña pausa entre lotes para no saturar el servidor
      if (i < batches.length - 1) {
        await sleep(100);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // 5. Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE GENERACIÓN DE DATOS');
    console.log('='.repeat(80));
    console.log(`\n✅ Clientes creados exitosamente: ${totalSuccess}`);
    if (totalFailures > 0) {
      console.log(`❌ Clientes fallidos: ${totalFailures}`);
    }
    console.log(`⏱️  Tiempo total: ${duration}s`);
    console.log(`📈 Velocidad: ${(totalSuccess / parseFloat(duration)).toFixed(2)} clientes/segundo`);
    console.log('\n' + '='.repeat(80) + '\n');

    if (totalSuccess >= 1000) {
      console.log('🎉 ¡Base de datos lista para ejecutar CP056!');
      console.log('   Ahora puedes ejecutar las pruebas de rendimiento de tabla.\n');
    } else {
      console.log('⚠️  Advertencia: Se crearon menos de 1000 clientes.');
      console.log('   Considera ejecutar el script nuevamente para completar los datos.\n');
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// ==============================================================================
// EJECUCIÓN
// ==============================================================================

// Validar argumentos
if (CLIENT_COUNT < 1 || CLIENT_COUNT > 10000) {
  console.error('❌ Error: La cantidad de clientes debe estar entre 1 y 10000');
  console.error('Uso: node generate-test-data.js [cantidad]');
  console.error('Ejemplo: node generate-test-data.js 1500');
  process.exit(1);
}

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});
