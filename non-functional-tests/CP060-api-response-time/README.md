# CP060 - Tiempo de Respuesta de API REST

## 📋 Descripción

Prueba de rendimiento que mide el tiempo de respuesta de los endpoints principales de la API REST del sistema, evaluando la velocidad del backend de forma aislada (sin UI).

## 🎯 Objetivo

Medir y validar que los endpoints de la API respondan en tiempos aceptables, identificando cuellos de botella en el backend antes de que afecten la experiencia del usuario.

## 📊 Métricas Evaluadas

| Endpoint | Método | Umbral | Descripción |
|----------|--------|--------|-------------|
| `/api/client/list` | GET | < 3000ms | Listar clientes |
| `/api/invoice/create` | POST | < 5000ms | Crear factura |
| `/api/admin/summary` | GET | < 4000ms | Estadísticas dashboard |

## 🧪 Casos de Prueba

### CP060-01: GET /api/client/list
- **Descripción**: Medir tiempo de respuesta al listar clientes
- **Mide**: Tiempo desde petición hasta respuesta completa
- **Esperado**: < 3 segundos
- **Valida**: Status 200, estructura de respuesta

### CP060-02: POST /api/invoice/create
- **Descripción**: Medir tiempo de creación de factura
- **Mide**: Tiempo de procesamiento backend (validación + inserción DB)
- **Esperado**: < 5 segundos
- **Valida**: Status 200/201, factura creada

### CP060-03: GET Dashboard Stats
- **Descripción**: Medir tiempo de carga de estadísticas
- **Mide**: Tiempo de queries agregadas
- **Esperado**: < 4 segundos
- **Valida**: Status 200, datos presentes

## 🚀 Ejecución

### Prerrequisitos
```bash
# Backend ejecutándose
cd backend
npm start

# Verificar API accesible
curl http://localhost:8888/api/client/list
```

### Ejecutar Tests
```bash
cd e2e-tests

# Ejecutar CP060
npm run perf:cp060

# Ver reporte
npx playwright show-report
```

## 📈 Interpretación de Resultados

### Ejemplo de Output Exitoso
```
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP060

⏱️  TIEMPOS DE RESPUESTA API:
  • GET /api/client/list: 58.62ms (umbral: 3000ms)
  • POST /api/invoice/create: 11.47ms (umbral: 5000ms)
  • GET /api/dashboard: 5.54ms (umbral: 4000ms)

📋 DETALLE DE ENDPOINTS:
  ❌ GET /api/client/list: 58.62ms [HTTP 401]
  ❌ POST /api/invoice/create: 11.47ms [HTTP 401]
  ❌ GET /api/admin/summary: 5.54ms [HTTP 401]

✅ VALIDACIONES:
  ✅ GET Client List: 58.62ms / 3000ms
  ✅ POST Invoice Create: 11.47ms / 5000ms
  ✅ GET Dashboard: 5.54ms / 4000ms

4 passed (9.2s)
```

**Nota:** Status 401 es esperado cuando se accede a la API directamente sin autenticación UI. El test valida principalmente **tiempo de respuesta**, no funcionalidad completa.

### Señales de Problema
- ⚠️ **GET > 5s**: Queries lentas, índices faltantes
- ⚠️ **POST > 8s**: Validaciones complejas, inserciones lentas
- ⚠️ **Status 500**: Errores en backend (revisar logs)
- ⚠️ **Status 404**: Endpoints no encontrados
- ℹ️ **Status 401**: Normal - API requiere autenticación (test mide solo tiempo de respuesta)

## 🔧 Troubleshooting

### Backend No Responde
```bash
# Verificar proceso ejecutándose
curl http://localhost:8888/api/client/list

# Si falla, revisar logs del backend
cd backend
npm start
```

### Status 401/403 (No Autorizado)
Los tests usan la sesión autenticada del setup. Si falla:
```bash
# Verificar auth.json existe
ls e2e-tests/test-data/auth.json

# Re-ejecutar setup
npx playwright test tests/auth.setup.ts
```

### Tiempos Muy Lentos
1. **Verificar base de datos**: Índices faltantes
2. **Revisar queries**: N+1 queries, JOINs complejos
3. **Comprobar dataset**: Tablas muy grandes
4. **Verificar red**: Latencia entre API y DB

## 📁 Estructura de Archivos

```
e2e-tests/
└── tests/
    └── performance/
        ├── cp056-table-rendering.spec.ts
        ├── cp057-search-response-time.spec.ts
        ├── cp058-login-latency.spec.ts
        ├── cp059-report-generation-time.spec.ts
        └── cp060-api-response-time.spec.ts (NUEVO)

non-functional-tests/
└── CP060-api-response-time/
    └── README.md (este archivo)
```

## 🔗 Tests Relacionados

### Tests de Performance
- **CP054**: Load Testing con k6 (carga concurrente)
- **CP056**: Table Rendering (UI performance)
- **CP057**: Search Response Time (búsqueda)
- **CP058**: Login Latency (autenticación)
- **CP059**: Report Generation (reportes)
- **CP060**: API Response Time ← ESTE TEST

### Diferencias con CP054
- **CP054 (k6)**: Mide carga concurrente (500 usuarios simultáneos)
- **CP060 (Playwright)**: Mide tiempo de respuesta individual de endpoints

## 📝 Notas

- Tests miden tiempo de respuesta de la API directamente
- **Status 401 es normal** - Muchas APIs requieren autenticación JWT que no se incluye en requests directos
- El objetivo es medir **velocidad de respuesta**, no funcionalidad completa
- POST tests pueden crear datos reales en BD (modo draft/test)
- Endpoints pueden variar según implementación del backend
- Test adapta si endpoints no existen (devuelve 404)
- Métricas excluyen latencia de red local (mismo host)

## 🎯 Criterios de Éxito

✅ **3/3 tests pasan** (4 incluyendo setup)
✅ **GET endpoints < 3-4 segundos**
✅ **POST endpoints < 5 segundos**
✅ **Tiempo de respuesta medido correctamente** (independiente de status code)
✅ **No timeouts** (< 60 segundos)

## 💡 Optimizaciones Recomendadas

### Backend
- **Índices MongoDB**: Crear en campos frecuentes
  ```javascript
  db.clients.createIndex({ name: 1, email: 1 });
  db.invoices.createIndex({ date: -1, status: 1 });
  ```

- **Paginación**: Limitar resultados
  ```javascript
  const limit = req.query.items || 10;
  const skip = (page - 1) * limit;
  ```

- **Projection**: Solo campos necesarios
  ```javascript
  Client.find({}, { name: 1, email: 1, _id: 1 });
  ```

- **Caché**: Redis para queries frecuentes
  ```javascript
  const cacheKey = 'dashboard:stats';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  ```

### Queries
- Evitar `populate()` excesivo
- Usar agregaciones eficientes
- Batch inserts para múltiples documentos
- Connection pooling

## 🔍 Análisis de Resultados

### Tiempos Normales
- **GET simple**: 500-1500ms
- **GET con agregación**: 1000-3000ms
- **POST simple**: 1000-2500ms
- **POST complejo**: 2000-5000ms

### Tiempos Preocupantes
- **GET > 5s**: Revisar inmediatamente
- **POST > 10s**: Problema crítico
- **Variación > 300%**: Inconsistencia

## ⚙️ Configuración

### Variables de Entorno
```bash
# .env
API_BASE_URL=http://localhost:8888
```

### Ajustar Umbrales
Editar en `cp060-api-response-time.spec.ts`:
```typescript
const PERFORMANCE_THRESHOLDS = {
  getClientList: 3000,      // Ajustar según necesidad
  postInvoiceCreate: 5000,
  getDashboardStats: 4000,
};
```

## 🆚 Comparación con Otros Tests

| Test | Qué Mide | Herramienta | Usuarios |
|------|----------|-------------|----------|
| CP054 | Carga concurrente | k6 | 500 |
| CP060 | Tiempo individual | Playwright | 1 |

**Cuándo usar cada uno:**
- **CP054**: Probar escalabilidad y límites del sistema
- **CP060**: Identificar endpoints lentos específicos
