# CP055: Carga Masiva de Facturas - Documentación Técnica

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID Caso de Prueba** | CP055 |
| **Nombre** | Carga Masiva de Facturas |
| **Tipo** | Prueba No Funcional - Carga/Estrés |
| **Prioridad** | Alta |
| **Herramienta** | k6 (Grafana k6) |
| **Duración Estimada** | 5 minutos |
| **Usuarios Concurrentes** | 5 → 30 |
| **Autor** | QA Team |
| **Fecha Creación** | 2025-11-19 |

---

## 🎯 Objetivo Técnico

Validar la capacidad del sistema para manejar **escrituras concurrentes masivas** en el módulo de facturas, evaluando:

1. **Throughput de escritura:** Facturas/segundo bajo carga
2. **Latencia p95/p99:** Tiempo de respuesta percentiles altos
3. **Integridad de datos:** Secuenciación única de números de factura
4. **Manejo de concurrencia:** Ausencia de race conditions
5. **Estabilidad del sistema:** Sin degradación ni errores críticos

---

## 🏗️ Arquitectura de la Prueba

### Flujo de Ejecución

```
┌─────────────────────────────────────────────────────────────┐
│                      SETUP PHASE                            │
│  - Autenticación única (admin@demo.com)                     │
│  - Obtención de token JWT                                   │
│  - Validación de conectividad                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   LOAD PHASES (5 minutos)                   │
│                                                              │
│  Phase 1: Warm-up        (30s)   0 → 5  usuarios           │
│  Phase 2: Gradual        (1m)    5 → 15 usuarios           │
│  Phase 3: Carga Masiva   (2m)   15 → 25 usuarios           │
│  Phase 4: Pico           (1m)   25 → 30 usuarios           │
│  Phase 5: Cooldown       (30s)  30 → 0  usuarios           │
│                                                              │
│  Cada usuario:                                               │
│   FOR i = 1 TO (3-5 facturas aleatorias)                    │
│     ├─ Generar payload aleatorio                            │
│     ├─ POST /api/invoice/create                             │
│     ├─ Validar respuesta (status, ID, número)               │
│     ├─ Registrar métricas                                   │
│     └─ Sleep 0.5-2s                                         │
│   END FOR                                                    │
│   Sleep 1-3s entre iteraciones                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEARDOWN PHASE                           │
│  - Imprimir resumen de ejecución                            │
│  - Validar umbrales (thresholds)                            │
│  - Exportar resultados JSON (opcional)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Métricas Detalladas

### Métricas Personalizadas (Custom Metrics)

#### 1. `invoices_created_total` (Counter)

**Tipo:** Contador acumulativo  
**Propósito:** Total de facturas creadas exitosamente  
**Incremento:** Se suma 1 cuando `response.status === 200 && body.success === true`  
**Uso:** Calcular throughput (facturas/segundo)

```javascript
invoicesCreated.add(1);  // Línea 243
```

#### 2. `invoice_creation_errors` (Rate)

**Tipo:** Tasa porcentual  
**Propósito:** Porcentaje de errores en creación de facturas  
**Cálculo:** `errores / total_intentos`  
**Umbral:** < 3% (0.03)  
**Uso:** KPI de fiabilidad

```javascript
invoiceErrors.add(1);  // Línea 254
```

#### 3. `invoice_creation_duration` (Trend)

**Tipo:** Tendencia temporal  
**Propósito:** Distribución de tiempos de creación  
**Estadísticas:** min, avg, med, max, p90, p95, p99  
**Umbral:** p95 < 3000ms  
**Uso:** Análisis de latencia

```javascript
const startTime = new Date();
// ... llamada HTTP
const duration = new Date() - startTime;
invoiceCreationTime.add(duration);  // Línea 218
```

#### 4. `duplicate_invoice_numbers` (Counter)

**Tipo:** Contador (debería ser 0)  
**Propósito:** Detectar números de factura duplicados (race conditions)  
**Umbral:** count == 0 (crítico)  
**Validación:** Requiere consulta post-prueba en BD

```javascript
// Implementación manual post-ejecución:
db.invoices.aggregate([
  { $group: { _id: "$number", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

### Métricas HTTP Integradas (k6 Built-in)

| Métrica | Descripción | Umbral | Uso |
|---------|-------------|--------|-----|
| `http_req_duration` | Tiempo total de petición (envío + espera + recepción) | p95 < 4000ms | Rendimiento general |
| `http_req_failed` | Tasa de fallos HTTP (status >= 400) | < 1% | Disponibilidad |
| `http_reqs` | Total de peticiones HTTP realizadas | - | Throughput |
| `data_received` | Bytes recibidos | - | Ancho de banda |
| `data_sent` | Bytes enviados | - | Ancho de banda |
| `iteration_duration` | Tiempo de iteración completa (3-5 facturas) | - | Análisis de flujo |
| `vus` | Usuarios virtuales activos | max: 30 | Carga |

---

## 🔬 Generación de Datos de Prueba

### Payload de Factura

```javascript
{
  "client": "507f1f77bcf86cd799439011",        // ID aleatorio de pool
  "date": "2025-11-19T14:30:00.000Z",          // Fecha actual
  "expiredDate": "2025-12-19T14:30:00.000Z",   // +30 días
  "year": 2025,
  "status": "draft",
  "taxRate": 21,                                // 10 o 21 (aleatorio)
  "items": [
    {
      "itemName": "Servicio de Consultoría",
      "description": "Asesoría técnica",
      "quantity": 5,                            // 1-11 (aleatorio)
      "price": 500
    },
    // 1-4 items por factura
  ],
  "notes": "Factura generada por prueba de carga - Usuario 12 - Factura #3"
}
```

### Función `generateInvoicePayload()`

**Ubicación:** Líneas 124-163  
**Parámetros:**
- `userIndex`: Índice del usuario virtual (`__VU`)
- `invoiceIndex`: Número de factura del usuario (0-4)

**Lógica:**
1. Seleccionar cliente aleatorio de `clients` array
2. Seleccionar impuesto aleatorio de `taxes` array
3. Generar 1-4 items con:
   - Item aleatorio de `sampleItems`
   - Cantidad aleatoria (1-10)
   - Precio del item predefinido
4. Calcular fechas (hoy + 30 días vencimiento)
5. Generar nota identificativa

**Variabilidad:**
- **Clientes:** 3 opciones
- **Impuestos:** 2 opciones (10%, 21%)
- **Items:** 5 tipos × 1-4 por factura × 1-10 cantidad = ~200 combinaciones
- **Total combinaciones:** ~1,200 payloads únicos posibles

---

## 🔐 Autenticación y Seguridad

### Setup Phase - Login

```javascript
export function setup() {
  const loginPayload = {
    email: 'admin@demo.com',
    password: 'admin123',
  };
  
  const loginRes = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify(loginPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  // Extraer token JWT
  const body = JSON.parse(loginRes.body);
  authToken = body.result?.token || '';
  
  return { token: authToken };  // Compartido con todos los VUs
}
```

### Headers de Autenticación

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${data.token}`,  // Token del setup
};
```

**Seguridad:**
- ✅ Un solo login (setup), token reutilizado por todos los VUs
- ✅ Token JWT válido durante toda la prueba (~5 min)
- ⚠️ **NO ejecutar en producción con credenciales reales**

---

## 📈 Análisis de Resultados

### Cálculos de Throughput

**Facturas esperadas:**
```
Fase 1 (30s):   5 usuarios  × 4 facturas × 0.5 min =  10 facturas
Fase 2 (1m):   15 usuarios  × 4 facturas × 1.0 min =  60 facturas
Fase 3 (2m):   25 usuarios  × 4 facturas × 2.0 min = 200 facturas
Fase 4 (1m):   30 usuarios  × 4 facturas × 1.0 min = 120 facturas
Fase 5 (30s): Cooldown (descartamos)             =    0 facturas
─────────────────────────────────────────────────────────────
TOTAL estimado:                                 ≈ 390 facturas
```

**Throughput medio:**
```
390 facturas / 270 segundos = 1.44 facturas/segundo
```

**Throughput pico (Fase 4):**
```
30 usuarios × 4 facturas / 60 segundos = 2 facturas/segundo
```

### Interpretación de Percentiles

| Percentil | Significado | Umbral | Interpretación |
|-----------|-------------|--------|----------------|
| **p50 (mediana)** | 50% de peticiones están por debajo | - | Usuario típico |
| **p90** | 90% de peticiones están por debajo | - | Mayoría de usuarios |
| **p95** | 95% de peticiones están por debajo | < 3000ms | SLA estándar |
| **p99** | 99% de peticiones están por debajo | - | Casos extremos |
| **max** | Peor caso registrado | - | Outliers |

**Ejemplo:**
```
http_req_duration: avg=1.2s min=500ms med=1.1s max=3.5s p(90)=2.1s p(95)=2.8s
```

**Análisis:**
- ✅ p95 = 2.8s < 3s → **PASS**
- ⚠️ max = 3.5s → Investigar outliers (logs backend)
- ✅ avg = 1.2s → Rendimiento aceptable

---

## 🚨 Umbrales (Thresholds) Explicados

### 1. `invoice_creation_duration: p(95)<3000`

**Criterio:** El 95% de las facturas deben crearse en menos de 3 segundos

**Razón:** 3 segundos es el límite de paciencia del usuario (Nielsen Norman Group)

**Acción si falla:**
- Optimizar consultas MongoDB (`client` lookup)
- Revisar generación de números de factura
- Considerar caché para impuestos/clientes

### 2. `invoice_creation_errors: rate<0.03`

**Criterio:** Menos del 3% de errores de creación

**Razón:** Margen de error aceptable en alta concurrencia

**Acción si falla:**
- Revisar logs de backend (500 errors)
- Verificar validación de schema (Joi)
- Comprobar integridad de datos de prueba

### 3. `http_req_failed: rate<0.01`

**Criterio:** Menos del 1% de fallos HTTP

**Razón:** Disponibilidad del 99% (SLA estándar)

**Acción si falla:**
- Verificar conectividad de red
- Revisar recursos del servidor (CPU/RAM)
- Escalar backend (más instancias)

### 4. `duplicate_invoice_numbers: count==0`

**Criterio:** Cero números duplicados (crítico)

**Razón:** Integridad de datos no negociable

**Acción si falla:**
- **BUG CRÍTICO:** Race condition en secuencia
- Implementar transacciones MongoDB
- Usar locks distribuidos (Redis)
- Revisar `increaseBySettingKey` en `settingController`

---

## 🔍 Validación Post-Prueba

### Queries MongoDB Recomendadas

#### 1. Detectar Duplicados

```javascript
db.invoices.aggregate([
  {
    $group: {
      _id: "$number",
      count: { $sum: 1 },
      docs: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { _id: 1 } }
])
```

**Resultado esperado:** `[]` (array vacío)

#### 2. Facturas de la Prueba

```javascript
db.invoices.find({
  notes: { $regex: /prueba de carga/ },
  created: { $gte: ISODate("2025-11-19T14:00:00Z") }
}).count()
```

**Resultado esperado:** ~300-500 facturas

#### 3. Verificar Integridad

```javascript
db.invoices.find({
  $or: [
    { items: { $size: 0 } },      // Sin items
    { client: null },             // Sin cliente
    { total: { $lte: 0 } },       // Total inválido
    { year: { $ne: 2025 } }       // Año incorrecto
  ],
  notes: { $regex: /prueba de carga/ }
})
```

**Resultado esperado:** `0` documentos

#### 4. Análisis de Números

```javascript
db.invoices.aggregate([
  { $match: { notes: { $regex: /prueba de carga/ } } },
  { $group: { _id: null, min: { $min: "$number" }, max: { $max: "$number" } } }
])
```

**Resultado esperado:**
```json
{ "_id": null, "min": 1001, "max": 1450 }
// Diferencia (max - min + 1) debe ser igual al count de facturas
```

---

## 🛠️ Configuración del Entorno

### Variables de Entorno

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `BASE_URL` | `http://localhost:8888` | URL del backend |
| `K6_OUT` | - | Formato de exportación (`json`, `influxdb`, etc.) |

**Ejemplo:**
```bash
# Ejecutar contra servidor remoto
BASE_URL=https://staging.idurar.com k6 run cp055-bulk-invoices.js

# Exportar a InfluxDB para Grafana
K6_OUT=influxdb=http://localhost:8086/k6 k6 run cp055-bulk-invoices.js
```

### Requisitos del Backend

**Recursos mínimos:**
- **CPU:** 4 cores (para 30 VUs)
- **RAM:** 4 GB
- **MongoDB:** Índices en `invoices.number`, `invoices.client`

**Índices recomendados:**
```javascript
db.invoices.createIndex({ number: 1 }, { unique: true })
db.invoices.createIndex({ client: 1 })
db.invoices.createIndex({ created: -1 })
```

---

## 📊 Integración con Grafana (Opcional)

### Setup InfluxDB + Grafana

1. **Instalar InfluxDB:**
```bash
docker run -p 8086:8086 influxdb:1.8
```

2. **Ejecutar k6 con output InfluxDB:**
```bash
k6 run --out influxdb=http://localhost:8086/k6 cp055-bulk-invoices.js
```

3. **Configurar Grafana:**
- Datasource: InfluxDB (URL: `http://localhost:8086`)
- Database: `k6`
- Dashboard: Importar plantilla oficial k6

**Métricas visualizables:**
- Gráfico de línea: `invoice_creation_duration` (p95, p99)
- Gauge: `invoice_creation_errors` (porcentaje)
- Counter: `invoices_created_total`
- Heatmap: Distribución de latencia

---

## 🐛 Troubleshooting Avanzado

### Error: "Cannot find module 'k6/data'"

**Causa:** Versión antigua de k6 (< 0.31)

**Solución:**
```bash
k6 version  # Verificar versión
# Actualizar a v0.40+ para SharedArray
```

### Error: "request timeout"

**Causa:** Backend sobrecargado o lento

**Diagnóstico:**
```javascript
// Agregar timeout personalizado
const response = http.post(url, payload, {
  headers,
  timeout: '10s',  // Aumentar timeout
});
```

### Error: "duplicate key error (E11000)"

**Causa:** Race condition en `number` (campo único)

**Solución permanente:**
```javascript
// En invoiceController/create.js
const session = await mongoose.startSession();
session.startTransaction();
try {
  const lastNumber = await Setting.findOneAndUpdate(
    { settingKey: 'last_invoice_number' },
    { $inc: { settingValue: 1 } },
    { session, new: true }
  );
  
  const invoice = await Invoice.create([{
    ...body,
    number: lastNumber.settingValue
  }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 📚 Referencias Técnicas

### Código Backend Relacionado

| Archivo | Línea | Descripción |
|---------|-------|-------------|
| `backend/src/controllers/appControllers/invoiceController/create.js` | 1-70 | Lógica de creación de factura |
| `backend/src/models/appModels/Invoice.js` | 1-150 | Schema de Invoice |
| `backend/src/middlewares/settings/index.js` | - | Gestión de secuencia de números |
| `backend/src/routes/appRoutes/appApi.js` | 15-20 | Ruta POST /invoice/create |

### Documentación Oficial k6

- **SharedArray:** https://k6.io/docs/javascript-api/k6-data/sharedarray/
- **Custom Metrics:** https://k6.io/docs/javascript-api/k6-metrics/
- **Thresholds:** https://k6.io/docs/using-k6/thresholds/
- **HTTP Module:** https://k6.io/docs/javascript-api/k6-http/

---

## 📝 Checklist de Ejecución

Antes de ejecutar CP055:

- [ ] k6 instalado (v0.40+)
- [ ] Backend activo en `http://localhost:8888`
- [ ] MongoDB activa con datos de prueba
- [ ] Credenciales de admin válidas (`admin@demo.com`)
- [ ] IDs de clientes actualizados en script (línea 30)
- [ ] IDs de impuestos actualizados en script (línea 41)
- [ ] Índices MongoDB creados (`number`, `client`)
- [ ] Espacio en disco suficiente (logs, resultados)

Después de ejecutar:

- [ ] Verificar umbrales pasados (todos ✓)
- [ ] Ejecutar queries de validación (duplicados, integridad)
- [ ] Revisar logs de backend (errores 500)
- [ ] Exportar resultados JSON para histórico
- [ ] Limpiar facturas de prueba (opcional)

---

**Última actualización:** 2025-11-19  
**Versión del script:** 1.0.0  
**Mantenedor:** QA Team
