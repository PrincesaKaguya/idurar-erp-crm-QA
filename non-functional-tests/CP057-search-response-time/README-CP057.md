# CP057 - Documentación Técnica Completa

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID** | CP057 |
| **Nombre** | Tiempo de Respuesta en Búsqueda de Clientes |
| **Categoría** | No Funcional - Rendimiento |
| **Prioridad** | Alta |
| **Tipo de Prueba** | UI Performance Testing (Playwright) |
| **Duración Estimada** | ~3-5 minutos |
| **Autor** | QA Team |
| **Fecha Creación** | 2025-01-19 |

---

## 🎯 Objetivos y Alcance

### Objetivo Principal
Medir y validar que el sistema de búsqueda de clientes responde dentro de tiempos aceptables para garantizar una experiencia de usuario fluida, incluso con datasets grandes (1000+ registros).

### Objetivos Específicos
1. ✅ Medir tiempo de búsqueda por nombre completo
2. ✅ Medir tiempo de búsqueda por email
3. ✅ Medir rendimiento de búsqueda parcial (autocompletado)
4. ✅ Validar manejo de búsquedas sin resultados
5. ✅ Separar tiempo de API vs tiempo de UI rendering
6. ✅ Evaluar rendimiento de limpiar búsqueda
7. ✅ Medir consistencia en búsquedas consecutivas
8. ✅ Validar correctitud de resultados

### Alcance

**Incluido:**
- ✅ Búsqueda por campo de nombre
- ✅ Búsqueda por patrón de email
- ✅ Búsqueda parcial (substring matching)
- ✅ Búsqueda sin resultados
- ✅ Medición de tiempo de API
- ✅ Medición de tiempo total (API + UI)
- ✅ Búsquedas consecutivas
- ✅ Validación de datos retornados

**No Incluido:**
- ❌ Búsqueda por múltiples criterios simultáneos
- ❌ Búsqueda con filtros avanzados (rango de fechas, etc.)
- ❌ Búsqueda case-sensitive
- ❌ Búsqueda con caracteres especiales/unicode
- ❌ Búsqueda en otros módulos (Invoice, Payment, etc.)

---

## 🔬 Especificación Técnica

### Arquitectura del Sistema de Búsqueda

```
┌─────────────┐
│   Browser   │
│  (Chromium) │
└──────┬──────┘
       │ 1. User types in search field
       │
       ▼
┌─────────────────────────────────┐
│  Frontend (React + Ant Design)  │
│  - Input component              │
│  - 500ms debounce               │
│  - Redux dispatch search action │
└──────┬──────────────────────────┘
       │ 2. API call after debounce
       │
       ▼
┌──────────────────────────────────┐
│  Backend API (Node.js/Express)   │
│  GET /api/client/list            │
│  - Query params: q=<term>        │
│  - MongoDB regex search          │
│  - Pagination: page=1, items=10  │
└──────┬───────────────────────────┘
       │ 3. Database query
       │
       ▼
┌──────────────────────────────┐
│   MongoDB Database           │
│   - Collection: clients      │
│   - Text index on name       │
│   - Regex: /term/i           │
└──────┬───────────────────────┘
       │ 4. Results (JSON array)
       │
       ▼
┌──────────────────────────────┐
│  Frontend Table Update       │
│  - Ant Design Table          │
│  - Re-render with results    │
│  - Pagination update         │
└──────────────────────────────┘
```

### Componentes Involucrados

#### 1. Frontend Search Component
**Ubicación:** `frontend/src/modules/CrudModule/`

```jsx
// SearchConfig para Customer
const searchConfig = {
  displayLabels: ['name'],
  searchFields: 'name',
};
```

**Características:**
- Ant Design Input component
- Debounce de 500ms (típico en sistemas similares)
- Búsqueda case-insensitive
- Limita a 10 resultados por defecto

#### 2. Backend Search Endpoint
**Archivo:** `backend/src/controllers/middlewaresControllers/createCRUDController/search.js`

```javascript
const search = async (Model, req, res) => {
  const fieldsArray = req.query.fields ? req.query.fields.split(',') : ['name'];
  const fields = { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }

  let results = await Model.find({
    ...fields,
  })
    .where('removed', false)
    .limit(20)
    .exec();

  if (results.length >= 1) {
    return res.status(200).json({
      success: true,
      result: results,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(202).json({
      success: false,
      result: [],
      message: 'No document found by this request',
    });
  }
};
```

**Parámetros Query:**
- `q`: Término de búsqueda (string)
- `fields`: Campos donde buscar (default: 'name')

**Respuesta:**
```json
{
  "success": true,
  "result": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Tech Solutions Corp",
      "email": "contact@techsolutions.com",
      "phone": "+1-555-1234",
      "enabled": true
    }
  ],
  "message": "Successfully found all documents"
}
```

#### 3. MongoDB Query
**Índice recomendado:**
```javascript
db.clients.createIndex({ name: "text", email: "text" })
```

**Query ejecutado:**
```javascript
db.clients.find({
  $or: [
    { name: { $regex: /tech/i } }
  ],
  removed: false
}).limit(20)
```

---

## 📊 Métricas y Umbrales

### Umbrales de Rendimiento

| Métrica | Umbral (ms) | Justificación |
|---------|-------------|---------------|
| Búsqueda por nombre | 2000 | Usuario espera respuesta rápida para búsqueda exacta |
| Búsqueda por email | 2000 | Similar a búsqueda por nombre |
| Búsqueda parcial | 2500 | Autocompletado puede ser ligeramente más lento |
| Sin resultados | 1500 | Query vacío debería ser más rápido |
| Respuesta API | 1000 | Backend debería responder en < 1s |
| Limpiar búsqueda | 1000 | Restaurar vista debería ser rápido |

### Distribución Típica de Tiempo

**Total: ~1500ms**
- 🔵 **API Response**: 500-700ms (33-47%)
  - MongoDB query: 200-400ms
  - Network latency: 50-100ms
  - Backend processing: 250-200ms
  
- 🟢 **UI Rendering**: 800-1000ms (53-67%)
  - Virtual DOM update: 200-300ms
  - Table re-render: 400-500ms
  - Pagination update: 200-200ms

### Factores que Afectan Rendimiento

**Backend:**
- ✅ Índices en MongoDB (name, email)
- ✅ Tamaño de dataset (1000 vs 10,000 clientes)
- ✅ Complejidad de regex (partial vs exact)
- ⚠️ Carga del servidor (CPU, memoria)
- ⚠️ Conexión a base de datos (latencia)

**Frontend:**
- ✅ Tamaño de resultados (10 vs 100 items)
- ✅ Complejidad de tabla (columnas, formateo)
- ✅ React reconciliation overhead
- ⚠️ Navegador (Chromium vs Firefox)
- ⚠️ Hardware del cliente

---

## 🧪 Casos de Prueba Detallados

### CP057-01: Búsqueda por Nombre

**Objetivo:** Validar rendimiento de búsqueda exacta por nombre

**Precondiciones:**
- Base de datos con 1000+ clientes
- Clientes con nombres que contienen "Tech Solutions"

**Pasos:**
1. Navegar a `/customer`
2. Esperar carga inicial de tabla
3. Escribir "Tech Solutions" en campo de búsqueda
4. Medir tiempo hasta ver resultados

**Datos de entrada:**
```typescript
searchTerm = "Tech Solutions"
```

**Resultado esperado:**
- ✅ Al menos 1 resultado encontrado
- ✅ Tiempo total < 2000ms
- ✅ Resultados contienen el término buscado
- ✅ Tabla actualizada correctamente

**Validaciones:**
```typescript
expect(resultCount).toBeGreaterThan(0);
expect(duration).toBeLessThan(2000);
```

---

### CP057-02: Búsqueda por Email

**Objetivo:** Validar rendimiento de búsqueda por patrón de email

**Precondiciones:**
- Clientes con emails que contienen "@techsolutions"

**Pasos:**
1. Navegar a `/customer`
2. Escribir "@techsolutions" en campo de búsqueda
3. Medir tiempo de respuesta

**Datos de entrada:**
```typescript
searchTerm = "@techsolutions"
```

**Resultado esperado:**
- ✅ Múltiples resultados con ese dominio
- ✅ Tiempo < 2000ms
- ✅ Emails coinciden con patrón

---

### CP057-03: Búsqueda Parcial

**Objetivo:** Medir autocompletado con término parcial

**Precondiciones:**
- Múltiples clientes con nombres que empiezan con "Tech"

**Pasos:**
1. Escribir solo "Tech" (4 caracteres)
2. Medir tiempo hasta ver lista de autocompletado

**Datos de entrada:**
```typescript
searchTerm = "Tech"
```

**Resultado esperado:**
- ✅ Múltiples resultados (> 5)
- ✅ Tiempo < 2500ms
- ✅ Todos contienen "Tech" en nombre

**Caso especial:**
- Debounce de 500ms aplicado antes de búsqueda

---

### CP057-04: Búsqueda Sin Resultados

**Objetivo:** Validar manejo de búsquedas que no retornan datos

**Precondiciones:**
- Término que definitivamente no existe en BD

**Pasos:**
1. Escribir "XYZ999NonExistent"
2. Medir tiempo hasta mensaje "No data"

**Datos de entrada:**
```typescript
searchTerm = "XYZ999NonExistent"
```

**Resultado esperado:**
- ✅ 0 resultados
- ✅ Mensaje "No data" visible
- ✅ Tiempo < 1500ms (más rápido que búsquedas exitosas)

**Validaciones:**
```typescript
expect(resultCount).toBe(0);
const emptyMessage = page.locator('.ant-empty-description');
await expect(emptyMessage).toBeVisible();
```

---

### CP057-05: Tiempo de Respuesta API

**Objetivo:** Separar tiempo de backend vs frontend

**Método:**
- Interceptar requests/responses con Playwright
- Medir `performance.now()` en evento `request`
- Medir `performance.now()` en evento `response`

**Implementación:**
```typescript
page.on('request', request => {
  if (request.url().includes('/api/client/list')) {
    apiStartTime = performance.now();
  }
});

page.on('response', response => {
  if (response.url().includes('/api/client/list')) {
    apiEndTime = performance.now();
  }
});

const apiTime = apiEndTime - apiStartTime;
const uiTime = totalTime - apiTime;
```

**Resultado esperado:**
- ✅ API < 1000ms
- ✅ UI rendering < 1500ms
- ℹ️ API representa ~40-50% del tiempo total

---

### CP057-06: Limpiar Búsqueda

**Objetivo:** Medir tiempo de restaurar vista completa

**Pasos:**
1. Realizar búsqueda con resultados
2. Limpiar campo de búsqueda
3. Medir tiempo hasta ver todos los registros

**Métodos de limpieza:**
- Borrar texto manualmente
- Click en botón "X" (clear icon)

**Resultado esperado:**
- ✅ Tabla muestra todos los registros (paginados)
- ✅ Tiempo < 1000ms
- ✅ Paginación restaurada

---

### CP057-07: Búsquedas Consecutivas

**Objetivo:** Evaluar consistencia de rendimiento

**Escenario:**
Ejecutar 4 búsquedas seguidas sin limpiar:

```typescript
const searches = [
  'Tech',              // Parcial
  '@techsolutions',    // Email
  'XYZ999NonExistent', // Sin resultados
  'Tech Solutions',    // Exacta
];
```

**Métricas calculadas:**
- Promedio de tiempos
- Tiempo mínimo
- Tiempo máximo
- Variación (max - min)

**Validaciones:**
```typescript
expect(avgTime).toBeLessThan(2500);
expect(variance).toBeLessThan(3000); // No más de 3s de diferencia
```

**Análisis:**
- ⚠️ Si promedio > 3s: Problema de performance general
- ⚠️ Si variación > 5s: Inconsistencia (posible caché, GC, etc.)

---

### CP057-08: Correctitud de Resultados

**Objetivo:** Validar integridad de datos además de velocidad

**Validaciones:**
1. **Contenido coincide:**
   ```typescript
   const firstRowName = await page.locator('.ant-table-tbody tr')
     .first().locator('td').nth(1).textContent();
   expect(firstRowName?.toLowerCase())
     .toContain(searchTerm.toLowerCase());
   ```

2. **Estructura de tabla:**
   ```typescript
   const headers = await page.locator('.ant-table-thead th')
     .allTextContents();
   expect(headers.length).toBeGreaterThan(3);
   ```

3. **Elementos UI:**
   - ✅ Tabla visible
   - ✅ Paginación presente
   - ✅ Sin errores en consola

---

## 📈 Análisis de Resultados

### Ejemplo de Output Completo

```
🧪 CP057-01: Midiendo búsqueda por nombre...
  ✅ Búsqueda completada en 1245.32ms
  📊 Resultados encontrados: 15

🧪 CP057-02: Midiendo búsqueda por email...
  ✅ Búsqueda completada en 1189.45ms
  📊 Resultados encontrados: 8

🧪 CP057-03: Midiendo búsqueda parcial...
  ✅ Búsqueda completada en 1678.90ms
  📊 Resultados encontrados: 24

🧪 CP057-04: Midiendo búsqueda sin resultados...
  ✅ Búsqueda completada en 892.11ms
  📊 Resultados encontrados: 0

🧪 CP057-05: Midiendo tiempo de respuesta de API...
  ✅ Respuesta API: 567.23ms
  🎨 Renderizado UI: 678.09ms
  ⏱️  Tiempo total: 1245.32ms
  📊 Resultados: 15

🧪 CP057-06: Midiendo tiempo de limpiar búsqueda...
  ✅ Búsqueda limpiada en 745.88ms
  📊 Registros visibles después de limpiar: 10

🧪 CP057-07: Midiendo búsquedas consecutivas...
  1. Búsqueda "Tech": 1234.56ms
  2. Búsqueda "@techsolutions": 1198.34ms
  3. Búsqueda "XYZ999NonExistent": 845.67ms
  4. Búsqueda "Tech Solutions": 1290.12ms

  📊 Estadísticas:
     • Promedio: 1142.17ms
     • Más rápida: 845.67ms
     • Más lenta: 1290.12ms
     • Variación: 444.45ms

🧪 CP057-08: Validando correctitud de resultados...
  ✅ Búsqueda completada en 1256.78ms
  📊 Resultados encontrados: 12
  🔍 Primer resultado: "Tech Solutions Corp #1"
  📋 Columnas visibles: 5

===============================================================================
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP057
===============================================================================

📈 TIEMPOS DE BÚSQUEDA:
  • Búsqueda por nombre: 1245.32ms (umbral: 2000ms)
  • Búsqueda por email: 1189.45ms (umbral: 2000ms)
  • Búsqueda parcial: 1678.90ms (umbral: 2500ms)
  • Sin resultados: 892.11ms (umbral: 1500ms)
  • Respuesta API: 567.23ms (umbral: 1000ms)
  • Limpiar búsqueda: 745.88ms (umbral: 1000ms)

📊 ESTADÍSTICAS GENERALES:
  • Total de búsquedas: 7
  • Tiempo promedio: 1142.17ms

✅ VALIDACIONES:
  ✅ Búsqueda nombre: 1245.32ms / 2000ms
  ✅ Búsqueda email: 1189.45ms / 2000ms
  ✅ Búsqueda parcial: 1678.90ms / 2500ms
  ✅ Sin resultados: 892.11ms / 1500ms
  ✅ Respuesta API: 567.23ms / 1000ms
  ✅ Limpiar búsqueda: 745.88ms / 1000ms

===============================================================================
```

### Interpretación de Métricas

#### ✅ Rendimiento Óptimo
```
Búsqueda por nombre: 1245ms
API: 567ms (45% del tiempo total)
UI: 678ms (55% del tiempo total)
```

**Análisis:**
- Backend rápido (< 1s)
- UI rendering eficiente
- Distribución balanceada

#### ⚠️ Rendimiento Aceptable
```
Búsqueda por nombre: 2890ms
API: 1234ms (43% del tiempo total)
UI: 1656ms (57% del tiempo total)
```

**Análisis:**
- Cerca del umbral (2000ms)
- Posible optimización en UI
- Backend todavía dentro de límites

#### ❌ Rendimiento Deficiente
```
Búsqueda por nombre: 4567ms
API: 2345ms (51% del tiempo total)
UI: 2222ms (49% del tiempo total)
```

**Problemas identificados:**
- ❌ Backend > 2s (revisar índices MongoDB)
- ❌ UI > 2s (revisar re-renders innecesarios)
- ⚠️ Posible problema de red/infraestructura

---

## 🔧 Optimizaciones Recomendadas

### Backend

#### 1. Índices MongoDB
```javascript
// Crear índices de texto
db.clients.createIndex({ name: "text", email: "text" });

// Índice compuesto para búsquedas comunes
db.clients.createIndex({ name: 1, enabled: 1, removed: 1 });
```

#### 2. Query Optimization
```javascript
// ANTES (lento)
Model.find({ name: { $regex: /term/i } })
  .where('removed', false);

// DESPUÉS (rápido)
Model.find({ 
  $text: { $search: 'term' },
  removed: false 
}).select('name email phone _id');
```

#### 3. Limitar Campos Retornados
```javascript
// Solo retornar campos necesarios
.select('name email phone _id')
```

### Frontend

#### 1. Debounce Optimizado
```javascript
// Aumentar debounce para reducir llamadas
const debouncedSearch = debounce(search, 800); // 500ms → 800ms
```

#### 2. Memoización
```javascript
// Evitar re-renders innecesarios
const MemoizedTable = React.memo(DataTable);
```

#### 3. Virtual Scrolling
```javascript
// Para listas grandes
import { FixedSizeList } from 'react-window';
```

---

## 🚨 Troubleshooting

### Problema 1: Tests Fallan por Timeout

**Síntoma:**
```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded
```

**Soluciones:**
1. Aumentar timeout en test:
```typescript
test.setTimeout(90000); // 90 segundos
```

2. Verificar que backend esté ejecutándose:
```bash
curl http://localhost:8888/api/client/list
```

3. Verificar logs de MongoDB para queries lentas

---

### Problema 2: No Encuentra Resultados

**Síntoma:**
```
Expected: > 0
Received: 0
```

**Soluciones:**
1. Verificar datos de prueba:
```bash
cd non-functional-tests/CP056-table-rendering
npm run generate
```

2. Verificar términos de búsqueda en test

3. Comprobar en navegador manualmente

---

### Problema 3: API Muy Lenta (> 2s)

**Diagnóstico:**
```javascript
// Agregar logging en backend
console.time('mongoQuery');
const results = await Model.find(...);
console.timeEnd('mongoQuery');
```

**Soluciones:**
1. Crear índices faltantes
2. Limitar resultados: `.limit(10)`
3. Revisar carga del servidor
4. Considerar caché (Redis)

---

### Problema 4: Variación Extrema en Tiempos

**Síntoma:**
```
Búsqueda 1: 1200ms
Búsqueda 2: 5400ms  ← Outlier
Búsqueda 3: 1150ms
```

**Causas posibles:**
- Garbage Collection en Node.js
- Cold start de base de datos
- Queries no optimizadas
- Network congestion

**Soluciones:**
1. Ejecutar múltiples veces y promediar
2. Descartar primer resultado (warm-up)
3. Monitorear recursos del servidor

---

## 📁 Estructura de Archivos

```
idurar-erp-crm/
│
├── e2e-tests/
│   ├── tests/
│   │   └── performance/
│   │       ├── cp056-table-rendering.spec.ts
│   │       └── cp057-search-response-time.spec.ts  ← NUEVO
│   │
│   ├── package.json (actualizado con script)
│   └── playwright.config.ts
│
└── non-functional-tests/
    ├── CP056-table-rendering/
    │   └── generate-test-data.js (reutilizado)
    │
    └── CP057-search-response-time/  ← NUEVO
        ├── README.md
        └── README-CP057.md (este archivo)
```

---

## 🔗 Tests Relacionados

### Tests de Rendimiento
- **CP054**: Load Testing con k6 (500 usuarios concurrentes)
- **CP055**: Bulk Invoice Generation (5000 facturas)
- **CP056**: Table Rendering (3000+ registros)
- **CP057**: Search Response Time ← ESTE TEST

### Tests Funcionales
- **CP032**: Single Criteria Search (funcional)
- **CP041**: Invoice Search (skipped - virtualization issue)

### Dependencias
- CP057 **requiere** datos de CP056 (1000+ clientes)
- CP057 **complementa** CP032 (funcional vs performance)

---

## 📊 Comparación con Otros Tests

| Test | Tipo | Objetivo | Dataset | Duración |
|------|------|----------|---------|----------|
| CP032 | Funcional | Búsqueda correcta | 10-50 clientes | 30s |
| CP056 | Performance | Renderizado tabla | 3000+ clientes | 60s |
| CP057 | Performance | Búsqueda rápida | 1000+ clientes | 5min |

---

## 🎯 Criterios de Aceptación Final

### Must Have (Obligatorio)
- ✅ 8/8 tests pasan
- ✅ Búsqueda por nombre < 2s
- ✅ Búsqueda por email < 2s
- ✅ API response < 1s
- ✅ Sin errores en consola

### Should Have (Deseable)
- ✅ Búsqueda parcial < 2.5s
- ✅ Promedio de búsquedas < 2s
- ✅ Variación < 3s

### Nice to Have (Opcional)
- ℹ️ API < 500ms (muy rápido)
- ℹ️ UI rendering < 500ms
- ℹ️ Búsquedas consecutivas sin degradación

---

## 📝 Notas de Implementación

### Playwright Configuration
```typescript
// playwright.config.ts
timeout: 60000, // Timeout global de 60s
expect: {
  timeout: 15000, // Assertions timeout 15s
},
```

### Environment Variables
```bash
# .env
BASE_URL=http://localhost:3000
API_URL=http://localhost:8888
```

### Data Requirements
- Mínimo: 500 clientes
- Recomendado: 1000+ clientes
- Óptimo: 3000+ clientes (usar CP056 generator)

---

## 🚀 Próximos Pasos

### Extensiones Futuras
1. **CP058**: Search with Multiple Criteria
2. **CP059**: Advanced Filters Performance
3. **CP060**: Export Performance (CSV/PDF)

### Mejoras Propuestas
- Agregar métricas de memory usage
- Medir First Contentful Paint (FCP)
- Network waterfall analysis
- Comparativa entre navegadores

---

## 📞 Soporte

**Documentación relacionada:**
- [Playwright Docs](https://playwright.dev)
- [Ant Design Table](https://ant.design/components/table)
- [MongoDB Text Search](https://docs.mongodb.com/manual/text-search/)

**Issues conocidos:**
- Ninguno identificado hasta la fecha

**Autor:** QA Team  
**Última actualización:** 2025-01-19
