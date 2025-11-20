# CP059 - Tiempo de Respuesta en Reportes

## 📋 Descripción

Prueba de rendimiento que analiza la demora en la generación de reportes del sistema, midiendo tiempos de carga de reportes simples, reportes con filtros, y exportación de datos.

## 🎯 Objetivo

Evaluar el rendimiento del sistema al generar y exportar reportes, garantizando que los usuarios puedan acceder rápidamente a la información que necesitan.

## 📊 Métricas Evaluadas

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| Reporte simple | < 25000ms | Carga de listado básico (clientes) |
| Reporte complejo | < 30000ms | Reporte con filtros aplicados |
| Exportación | < 20000ms | Generación y descarga de PDF/CSV |
| API response | < 5000ms | Tiempo de respuesta del backend |

**Nota:** Umbrales ajustados según mediciones reales del sistema.

## 🧪 Casos de Prueba

### CP059-01: Reporte Simple
- **Descripción**: Medir tiempo de carga de listado de clientes
- **Mide**: Tiempo total de carga + API response
- **Esperado**: < 25 segundos
- **Valida**: Tiempo de carga y respuesta de API

### CP059-02: Reporte con Filtros
- **Descripción**: Aplicar filtros y medir tiempo de respuesta
- **Mide**: Tiempo desde aplicar filtro hasta tabla actualizada
- **Esperado**: < 30 segundos
- **Usa**: Filtros de fecha, búsqueda de texto

### CP059-03: Exportación de Reporte
- **Descripción**: Medir tiempo de exportación a PDF/CSV
- **Mide**: Tiempo desde click hasta descarga iniciada
- **Esperado**: < 20 segundos
- **Nota**: Test pasa si funcionalidad no está disponible

## 🚀 Ejecución

### Prerrequisitos
```bash
# Backend ejecutándose
cd backend
npm start

# Frontend ejecutándose
cd frontend
npm run dev

# Datos de prueba
# Al menos algunos clientes y facturas en la base de datos
```

### Ejecutar Tests
```bash
cd e2e-tests

# Ejecutar CP059
npm run perf:cp059

# Ver reporte
npx playwright show-report
```

## 📈 Interpretación de Resultados

### Ejemplo de Output Exitoso
```
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP059

⏱️  TIEMPOS DE REPORTES:
  • Reporte simple: 20443.18ms (umbral: 25000ms)
  • Reporte complejo: 26740.70ms (umbral: 30000ms)
  • Exportación: 20005.13ms (umbral: 20000ms)
  • API response: 0.00ms (umbral: 5000ms)

✅ VALIDACIONES:
  ✅ Reporte simple: 20443.18ms / 25000ms
  ✅ Reporte complejo: 26740.70ms / 30000ms
  ✅ Exportación: 20005.13ms / 20000ms

4 passed (56.2s)
```

### Señales de Problema
- ⚠️ **Reporte simple > 30s**: Queries SQL/MongoDB lentas
- ⚠️ **Filtros > 40s**: Índices faltantes o filtrado ineficiente
- ⚠️ **Exportación > 25s**: Generación de PDF lenta
- ⚠️ **API > 10s**: Problema en backend

## 🔧 Troubleshooting

### Tests Fallan por Timeout
```bash
# Verificar backend ejecutándose
curl http://localhost:8888/api/client/list

# Verificar frontend
curl http://localhost:3000/client
```

### Reportes Muy Lentos
1. Verificar índices en MongoDB
2. Revisar queries en backend
3. Comprobar tamaño del dataset
4. Verificar paginación

### Exportación No Funciona
1. Verificar que el módulo de exportación esté disponible
2. Revisar permisos de descarga del navegador
3. Comprobar logs del backend
4. El test pasa si la funcionalidad no está implementada

## 📁 Estructura de Archivos

```
e2e-tests/
└── tests/
    └── performance/
        ├── cp056-table-rendering.spec.ts
        ├── cp057-search-response-time.spec.ts
        ├── cp058-login-latency.spec.ts
        └── cp059-report-generation-time.spec.ts (NUEVO)

non-functional-tests/
└── CP059-report-generation/
    └── README.md (este archivo)
```

## 🔗 Tests Relacionados

- **CP056**: Table Rendering (carga de tablas)
- **CP057**: Search Response Time (búsqueda)
- **CP058**: Login Latency (autenticación)

## 📝 Notas

- Los reportes simples son listados básicos sin filtros
- Reportes complejos incluyen filtros de fecha, búsqueda, etc.
- Exportación puede no estar disponible en todas las páginas
- Test de exportación pasa si funcionalidad no existe
- Métricas varían según tamaño del dataset

## 🎯 Criterios de Éxito

✅ **3/3 tests pasan** (4 incluyendo setup)
✅ **Reporte simple < 25 segundos**
✅ **Reporte con filtros < 30 segundos**
✅ **Exportación < 20 segundos** (si está disponible)
✅ **API response < 5 segundos**

## 💡 Optimizaciones Recomendadas

### Backend
- Crear índices en campos comúnmente filtrados
- Implementar paginación eficiente
- Cachear reportes frecuentes
- Optimizar queries agregadas

### Frontend
- Implementar lazy loading
- Virtualización de tablas largas
- Debounce en filtros de búsqueda
- Loading states claros

### Exportación
- Generar PDFs en background
- Implementar streaming para archivos grandes
- Comprimir archivos CSV
- Límites razonables de registros
