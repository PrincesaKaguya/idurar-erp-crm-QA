# CP057 - Tiempo de Respuesta en Búsqueda de Clientes

## 📋 Descripción

Prueba de rendimiento que mide el tiempo que tarda el sistema en mostrar resultados al buscar un cliente específico utilizando diferentes criterios de búsqueda.

## 🎯 Objetivo

Verificar que el sistema de búsqueda de clientes responde dentro de los umbrales de rendimiento aceptables para garantizar una experiencia de usuario fluida.

## 📊 Métricas Evaluadas

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| Búsqueda por nombre | < 2000ms | Tiempo de búsqueda exacta por nombre |
| Búsqueda por email | < 2000ms | Tiempo de búsqueda por patrón de email |
| Búsqueda parcial | < 2500ms | Autocompletado con término parcial |
| Búsqueda sin resultados | < 1500ms | Respuesta cuando no hay coincidencias |
| Respuesta API | < 1000ms | Tiempo de respuesta del backend |
| Limpiar búsqueda | < 1000ms | Tiempo de recargar todos los registros |

## 🧪 Casos de Prueba

### CP057-01: Búsqueda por Nombre
- **Descripción**: Medir tiempo de búsqueda exacta por nombre de cliente
- **Datos**: "Tech Solutions"
- **Esperado**: Resultados en < 2 segundos

### CP057-02: Búsqueda por Email
- **Descripción**: Medir tiempo de búsqueda por patrón de email
- **Datos**: "@techsolutions"
- **Esperado**: Resultados en < 2 segundos

### CP057-03: Búsqueda Parcial
- **Descripción**: Medir autocompletado con término parcial
- **Datos**: "Tech"
- **Esperado**: Múltiples resultados en < 2.5 segundos

### CP057-04: Búsqueda Sin Resultados
- **Descripción**: Validar respuesta cuando no hay coincidencias
- **Datos**: "XYZ999NonExistent"
- **Esperado**: Mensaje "No data" en < 1.5 segundos

### CP057-05: Tiempo de Respuesta API
- **Descripción**: Medir específicamente el tiempo del backend
- **Validación**: API < 1s, UI rendering separado

### CP057-06: Limpiar Búsqueda
- **Descripción**: Medir tiempo de restaurar vista completa
- **Esperado**: Tabla completa en < 1 segundo

### CP057-07: Búsquedas Consecutivas
- **Descripción**: Rendimiento de múltiples búsquedas seguidas
- **Validación**: Promedio < 2.5s, variación < 3s

### CP057-08: Correctitud de Resultados
- **Descripción**: Validar que los resultados coinciden con el término
- **Validación**: Datos correctos y estructura de tabla íntegra

## 🚀 Ejecución

### Prerrequisitos
```bash
# Backend ejecutándose
cd backend
npm start

# Frontend ejecutándose
cd frontend
npm run dev

# Base de datos con clientes de prueba (usar datos de CP056)
cd non-functional-tests/CP056-table-rendering
npm run generate
```

### Ejecutar Tests
```bash
cd e2e-tests

# Ejecutar CP057
npm run perf:cp057

# Ver reporte
npx playwright show-report
```

## 📈 Interpretación de Resultados

### Ejemplo de Output Exitoso
```
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP057

📈 TIEMPOS DE BÚSQUEDA:
  • Búsqueda por nombre: 1245.32ms (umbral: 2000ms)
  • Búsqueda por email: 1189.45ms (umbral: 2000ms)
  • Búsqueda parcial: 1678.90ms (umbral: 2500ms)
  • Sin resultados: 892.11ms (umbral: 1500ms)
  • Respuesta API: 567.23ms (umbral: 1000ms)
  • Limpiar búsqueda: 745.88ms (umbral: 1000ms)

📊 ESTADÍSTICAS GENERALES:
  • Total de búsquedas: 7
  • Tiempo promedio: 1245.67ms

✅ VALIDACIONES:
  ✅ Búsqueda nombre: 1245.32ms / 2000ms
  ✅ Búsqueda email: 1189.45ms / 2000ms
  ✅ Búsqueda parcial: 1678.90ms / 2500ms
  ✅ Sin resultados: 892.11ms / 1500ms
  ✅ Respuesta API: 567.23ms / 1000ms
  ✅ Limpiar búsqueda: 745.88ms / 1000ms
```

### Señales de Problema
- ⚠️ **Búsquedas > 3s**: Posible problema de índices en base de datos
- ⚠️ **API > 2s**: Revisar consultas SQL/MongoDB
- ⚠️ **Variación > 5s**: Inconsistencia en rendimiento del servidor
- ⚠️ **Sin resultados lento**: Problema en validación de queries vacías

## 🔧 Troubleshooting

### Tests Fallan por Timeout
```bash
# Aumentar timeout en playwright.config.ts
timeout: 90000 # 90 segundos
```

### No Encuentra Resultados
```bash
# Verificar que existen clientes con esos nombres
# Usar datos generados por CP056
cd non-functional-tests/CP056-table-rendering
npm run generate
```

### Búsqueda Muy Lenta
1. Verificar índices en MongoDB:
```javascript
db.clients.createIndex({ name: "text", email: "text" })
```

2. Revisar logs del backend para queries lentas

## 📁 Estructura de Archivos

```
e2e-tests/
└── tests/
    └── performance/
        └── cp057-search-response-time.spec.ts

non-functional-tests/
└── CP057-search-response-time/
    ├── README.md
    └── README-CP057.md (documentación técnica)
```

## 🔗 Tests Relacionados

- **CP032**: Búsqueda con criterio único (funcional)
- **CP056**: Rendimiento de renderizado de tabla
- **CP041**: Búsqueda de facturas (funcional, skipped)

## 📝 Notas

- Utiliza los datos generados por CP056 (3000+ clientes)
- Debounce de búsqueda configurado en 500ms
- API endpoint: `GET /api/client/list?q=<term>&fields=name`
- Frontend usa Ant Design Table con búsqueda integrada

## 🎯 Criterios de Éxito

✅ **8/8 tests pasan**
✅ **Todas las búsquedas < umbrales definidos**
✅ **Respuesta API < 1 segundo**
✅ **Resultados correctos y consistentes**
✅ **Sin errores en consola del navegador**
