/**
 * Script auxiliar para obtener IDs de clientes y taxes desde MongoDB
 * 
 * Uso:
 *   node get-test-ids.js
 * 
 * Este script se conecta a MongoDB y obtiene IDs reales de clientes y taxes
 * para usar en cp055-bulk-invoices.js
 */

const mongoose = require('mongoose');

// Conexión por defecto (ajusta si usas otra URL)
const DB_URL = process.env.DATABASE || 'mongodb://localhost:27017/idurar';

async function getTestIds() {
  try {
    // Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    console.log(`   URL: ${DB_URL}\n`);
    await mongoose.connect(DB_URL);
    console.log('✅ Conectado a MongoDB\n');

    // Obtener clientes
    console.log('📋 Obteniendo clientes...');
    const clients = await mongoose.connection.db
      .collection('clients')
      .find({ enabled: true, removed: false })
      .limit(3)
      .toArray();

    if (clients.length === 0) {
      console.warn('⚠️  No se encontraron clientes activos.');
      console.log('   Crea al menos 3 clientes en el sistema antes de ejecutar CP055.\n');
    } else {
      console.log('✅ Clientes encontrados:');
      clients.forEach((client, idx) => {
        console.log(`   ${idx + 1}. ${client.company || client.name || 'Sin nombre'} (${client._id})`);
      });
      console.log();
    }

    // Obtener taxes
    console.log('📋 Obteniendo impuestos...');
    const taxes = await mongoose.connection.db
      .collection('taxes')
      .find({ enabled: true, removed: false })
      .toArray();

    if (taxes.length === 0) {
      console.warn('⚠️  No se encontraron impuestos activos.');
      console.log('   Crea al menos 2 impuestos (ej: IVA 21%, IVA 10%) antes de ejecutar CP055.\n');
    } else {
      console.log('✅ Impuestos encontrados:');
      taxes.forEach((tax, idx) => {
        console.log(`   ${idx + 1}. ${tax.taxName} - ${tax.taxValue}% (${tax._id})`);
      });
      console.log();
    }

    // Generar código para copiar/pegar
    if (clients.length >= 3 && taxes.length >= 2) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('📝 COPIA Y PEGA ESTE CÓDIGO en cp055-bulk-invoices.js');
      console.log('═══════════════════════════════════════════════════════\n');

      console.log('// Línea 30-38: Clientes');
      console.log('const clients = new SharedArray(\'clients\', function () {');
      console.log('  return [');
      clients.slice(0, 3).forEach((client) => {
        const name = client.company || client.name || 'Cliente';
        console.log(`    { id: '${client._id}', name: '${name}' },`);
      });
      console.log('  ];');
      console.log('});\n');

      console.log('// Línea 41-46: Impuestos');
      console.log('const taxes = new SharedArray(\'taxes\', function () {');
      console.log('  return [');
      taxes.slice(0, 2).forEach((tax) => {
        console.log(`    { id: '${tax._id}', name: '${tax.taxName}', rate: ${tax.taxValue} },`);
      });
      console.log('  ];');
      console.log('});\n');

      console.log('═══════════════════════════════════════════════════════');
    } else {
      console.log('\n❌ DATOS INSUFICIENTES:');
      console.log(`   - Clientes encontrados: ${clients.length}/3 requeridos`);
      console.log(`   - Impuestos encontrados: ${taxes.length}/2 requeridos`);
      console.log('\n💡 Solución:');
      console.log('   1. Inicia el backend: cd ../../backend && npm run dev');
      console.log('   2. Abre http://localhost:3000');
      console.log('   3. Crea clientes y configura impuestos');
      console.log('   4. Ejecuta nuevamente: node get-test-ids.js');
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solución: Inicia MongoDB');
      console.log('   Windows: net start MongoDB');
      console.log('   Linux/Mac: sudo systemctl start mongod');
    }
    
    process.exit(1);
  }
}

getTestIds();
