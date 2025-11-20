# CP055: Carga Masiva de Facturas

## 📋 Descripción

Prueba no funcional que valida que el sistema permita la **carga simultánea de múltiples facturas** por varios usuarios concurrentes, evaluando el rendimiento, la fiabilidad y la integridad de los datos bajo carga masiva.

---

## 🎯 Objetivo

Verificar que el sistema ERP/CRM puede manejar eficientemente:
- Creación simultánea de facturas por múltiples usuarios
- Mantenimiento de la integridad de datos (números únicos de factura)
- Tiempos de respuesta aceptables bajo alta carga de escritura
- Ausencia de errores en operaciones concurrentes

---

## 📊 Escenario de Prueba

### Fases de Carga

| Fase | Duración | Usuarios Concurrentes | Descripción |
|------|----------|----------------------|-------------|
| 1. Warm-up | 30s | 0 → 5 | Calentamiento del sistema |
| 2. Carga gradual | 1m | 5 → 15 | Incremento progresivo |
| 3. Carga masiva | 2m | 15 → 25 | Carga de producción |
| 4. Pico de carga | 1m | 25 → 30 | Estrés máximo |
| 5. Cooldown | 30s | 30 → 0 | Enfriamiento |

**Duración total:** ~5 minutos

### Comportamiento de Usuarios

Cada usuario virtual (VU):
1. Se autentica en el sistema
2. Crea **entre 3-5 facturas** consecutivas
3. Cada factura contiene:
   - Cliente aleatorio (de un pool de 3 clientes)
   - 1-4 items aleatorios con cantidades/precios variables
   - Tasa de impuesto aleatoria (IVA 10% o 21%)
   - Fecha de vencimiento (30 días)
4. Pausa breve entre creaciones (0.5-2 segundos)

### Cálculo de Facturas Totales

Con 30 usuarios activos durante ~5 minutos:
- **Estimado:** ~300-500 facturas creadas
- **Pico:** ~25-30 facturas/segundo

---

## 📈 Métricas y Umbrales

### Métricas Personalizadas

| Métrica | Tipo | Descripción | Umbral |
|---------|------|-------------|--------|
| `invoices_created_total` | Counter | Total de facturas creadas exitosamente | - |
| `invoice_creation_errors` | Rate | Tasa de error en creación | < 3% |
| `invoice_creation_duration` | Trend | Tiempo de creación de facturas | p95 < 3s |
| `duplicate_invoice_numbers` | Counter | Números de factura duplicados | 0 |

### Umbrales de Rendimiento

```javascript
thresholds: {
  'invoice_creation_duration': ['p(95)<3000'],    // 95% en menos de 3s
  'invoice_creation_errors': ['rate<0.03'],       // Menos del 3% de errores
  'http_req_failed': ['rate<0.01'],               // 99% de éxito
  'http_req_duration': ['p(95)<4000'],            // p95 < 4s general
  'duplicate_invoice_numbers': ['count==0'],      // Cero duplicados
}
```

---

## 🚀 Ejecución

### Requisitos Previos

1. **k6 instalado** (ver `SETUP-CP055.md`)
2. **Backend y frontend activos**
3. **Datos de prueba configurados:**
   - Clientes existentes en la BD
   - Impuestos (IVA 10%, IVA 21%)
   - Usuario admin: `admin@demo.com` / `admin123`

### Configurar IDs de Clientes/Impuestos

**IMPORTANTE:** Antes de ejecutar, actualiza los IDs en el script:

#### Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar script auxiliar para obtener IDs
node get-test-ids.js
```

El script te mostrará el código para copiar/pegar en `cp055-bulk-invoices.js`.

#### Opción 2: Manual

**Cómo obtener los IDs:**
```bash
# Iniciar MongoDB (si no está corriendo)
# Windows:
net start MongoDB

# Linux/macOS:
sudo systemctl start mongod

# Conectar a MongoDB
mongosh

# En mongosh:
use idurar
db.clients.find({enabled: true, removed: false}, {_id: 1, company: 1}).limit(3)
db.taxes.find({enabled: true, removed: false}, {_id: 1, taxName: 1, taxValue: 1})
```

**Actualizar en el script:**

```javascript
// Línea 30-38: Ajusta estos IDs según tu base de datos
const clients = new SharedArray('clients', function () {
  return [
    { id: 'TU_CLIENT_ID_1', name: 'Test Client 1' },
    { id: 'TU_CLIENT_ID_2', name: 'Test Client 2' },
    { id: 'TU_CLIENT_ID_3', name: 'Test Client 3' },
  ];
});

// Línea 41-46: Ajusta IDs de impuestos
const taxes = new SharedArray('taxes', function () {
  return [
    { id: 'TU_TAX_ID_1', name: 'IVA 21%', rate: 21 },
    { id: 'TU_TAX_ID_2', name: 'IVA 10%', rate: 10 },
  ];
});
```

### Comandos de Ejecución

#### Prueba Completa (5 minutos)
```bash
cd non-functional-tests/CP055-bulk-invoices
k6 run cp055-bulk-invoices.js
```

#### Prueba Rápida (1 minuto, 10 usuarios)
```bash
k6 run --vus 10 --duration 1m cp055-bulk-invoices.js
```

#### Con Variables de Entorno
```bash
# Windows PowerShell
$env:BASE_URL="http://localhost:8888"; k6 run cp055-bulk-invoices.js

# Linux/macOS
BASE_URL=http://localhost:8888 k6 run cp055-bulk-invoices.js
```

#### Exportar Resultados
```bash
k6 run --out json=cp055-results.json cp055-bulk-invoices.js
```

---

## 📊 Interpretación de Resultados

### Ejemplo de Salida Exitosa

```
✓ Status 200
✓ Respuesta válida
✓ Factura tiene ID
✓ Número de factura asignado

checks.........................: 100.00% ✓ 1200      ✗ 0
data_received..................: 2.1 MB  420 kB/s
data_sent......................: 890 kB  178 kB/s
http_req_duration..............: avg=1.2s   p(95)=2.8s  max=3.5s
http_req_failed................: 0.00%   ✓ 0         ✗ 1200
invoices_created_total.........: 300     (300 facturas creadas)
invoice_creation_errors........: 1.33%   (4 errores de 300)
invoice_creation_duration......: avg=1.1s   p(95)=2.5s
duplicate_invoice_numbers......: 0       (sin duplicados)
vus............................: 30      max=30
```

### Indicadores de Éxito ✅

- ✅ `invoice_creation_errors` < 3%
- ✅ `invoice_creation_duration p(95)` < 3000ms
- ✅ `duplicate_invoice_numbers` = 0
- ✅ `http_req_failed` < 1%
- ✅ Checks al 100%

### Señales de Alerta ⚠️

- ⚠️ Tasa de error > 3%
- ⚠️ p95 > 3000ms (degradación de rendimiento)
- ⚠️ Números de factura duplicados (fallo crítico de integridad)
- ⚠️ Errores 500 (problemas en el servidor)

---

## 🔍 Validación Post-Prueba

### 1. Verificar Números Únicos

```javascript
// En MongoDB
db.invoices.aggregate([
  { $group: { _id: "$number", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
// Debe retornar array vacío []
```

### 2. Contar Facturas Creadas

```javascript
db.invoices.countDocuments({
  created: { $gte: new Date('2025-11-19T10:00:00') }
})
```

### 3. Verificar Integridad de Datos

```javascript
db.invoices.find({
  items: { $size: 0 },  // Facturas sin items
  client: null,         // Facturas sin cliente
}).count()
// Debe ser 0
```

---

## 🛠️ Resolución de Problemas

### Error: "Falló la autenticación inicial"

**Solución:**
```javascript
// Actualiza credenciales en línea 163
const loginPayload = {
  email: 'TU_EMAIL',
  password: 'TU_PASSWORD',
};
```

### Error: "Client not found"

**Causa:** IDs de clientes no existen en la base de datos

**Solución:**
1. Obtén IDs reales: `db.clients.find({}, {_id:1}).limit(3)`
2. Actualiza array `clients` en línea 30-38

### Alta Tasa de Errores (> 10%)

**Posibles causas:**
- Base de datos sobrecargada
- Backend sin recursos suficientes
- Red lenta

**Diagnóstico:**
```bash
# Monitorear recursos del servidor
# Windows: Task Manager
# Linux: htop, docker stats
```

### Números de Factura Duplicados

**Causa:** Problema en la secuencia de numeración (race condition)

**Acción:**
1. Revisar controlador `invoiceController/create.js`
2. Verificar implementación de `increaseBySettingKey`
3. Considerar usar transacciones MongoDB

---

## 📦 Archivos Relacionados

- `cp055-bulk-invoices.js` - Script principal k6
- `README.md` - Esta documentación
- `SETUP-CP055.md` - Guía de instalación k6
- `README-CP055.md` - Documentación técnica detallada
- `cp055-results.json` - Resultados de la última ejecución

---

## 🔗 Referencias

- **Backend Invoice Controller:** `backend/src/controllers/appControllers/invoiceController/create.js`
- **Invoice Model:** `backend/src/models/appModels/Invoice.js`
- **API Endpoint:** `POST /api/invoice/create`
- **k6 Documentation:** https://k6.io/docs/

---

## 📝 Notas Importantes

1. **Limpieza de datos:** Esta prueba crea facturas reales en la BD. Ejecutar en entorno de prueba.
2. **Impacto en rendimiento:** Puede afectar sistema en producción.
3. **Datos de prueba:** Usar clientes/impuestos de prueba, no datos reales.
4. **Monitoreo:** Observar logs del backend durante la ejecución.

---

## 🎓 Atributos No Funcionales Evaluados

- ✅ **Rendimiento:** Tiempo de respuesta bajo alta carga de escritura
- ✅ **Fiabilidad:** Tasa de éxito en operaciones concurrentes
- ✅ **Integridad:** Consistencia de datos (números únicos)
- ✅ **Escalabilidad:** Capacidad de manejar múltiples usuarios simultáneos
- ✅ **Disponibilidad:** Sistema operativo bajo carga sostenida

---

**Última actualización:** Noviembre 19, 2025  
**Versión:** 1.0.0  
**Autor:** QA Team
