# CP056 - Prueba de Rendimiento de Renderizado de Tabla de Clientes

## 📋 Descripción

Prueba de rendimiento para evaluar el comportamiento del sistema al renderizar la tabla de clientes con más de 1000 registros. Mide tiempos de carga, paginación, búsqueda y correctitud visual.

## 🎯 Objetivos

1. **Medir tiempo de carga inicial** de la tabla con 1000+ registros
2. **Evaluar rendimiento de paginación** al navegar entre páginas
3. **Medir tiempo de respuesta de búsqueda/filtrado**
4. **Verificar correctitud visual** con grandes volúmenes de datos
5. **Validar experiencia de usuario** sin bloqueos o lag visual

## ⚙️ Configuración Rápida

### 1. Requisitos Previos

```bash
# Desde el directorio e2e-tests/
npm install
```

### 2. Generar Datos de Prueba

Ejecutar el script para crear 1500 clientes ficticios:

```bash
# Desde non-functional-tests/CP056-table-rendering/
node generate-test-data.js 1500
```

**Nota**: El backend debe estar corriendo en `http://localhost:8888`

### 3. Ejecutar Pruebas

```bash
# Desde el directorio e2e-tests/
npm run perf:cp056

# O ejecutar directamente con Playwright
npx playwright test ../non-functional-tests/CP056-table-rendering/cp056-table-rendering.spec.ts --project=chromium
```

## 📊 Métricas Evaluadas

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| **Carga Inicial** | < 3000ms | Tiempo desde navegación hasta tabla renderizada |
| **Renderizado Tabla** | < 3000ms | Tiempo de renderizado completo de elementos |
| **Cambio de Página** | < 1000ms | Tiempo de respuesta al cambiar página |
| **Búsqueda/Filtrado** | < 2000ms | Tiempo de respuesta a búsquedas |
| **Recarga Manual** | < 2000ms | Tiempo de recarga con botón Refresh |

## ✅ Criterios de Aceptación

- ✅ Tabla carga en menos de 3 segundos
- ✅ Paginación responde en menos de 1 segundo
- ✅ Búsqueda/filtrado responde en menos de 2 segundos
- ✅ No hay bloqueos visuales durante navegación
- ✅ Todos los elementos UI se renderizan correctamente
- ✅ No aparecen mensajes de error

## 📁 Archivos del Proyecto

```
CP056-table-rendering/
├── cp056-table-rendering.spec.ts  # Suite de pruebas Playwright
├── generate-test-data.js          # Script para generar 1500+ clientes
├── README.md                      # Este archivo
├── README-CP056.md                # Documentación técnica detallada
└── SETUP-CP056.md                 # Guía de instalación y troubleshooting
```

## 🧪 Casos de Prueba

### CP056-01: Carga Inicial
Mide el tiempo de carga inicial al navegar a `/customer`

### CP056-02: Renderizado de Tabla
Evalúa el tiempo de renderizado completo con botón Refresh

### CP056-03: Paginación
Mide el tiempo de respuesta al cambiar de página

### CP056-04: Búsqueda
Evalúa el rendimiento del filtrado de registros

### CP056-05: Recarga Manual
Mide el tiempo de recarga con botón Refresh

### CP056-06: Correctitud Visual
Verifica que todos los elementos UI se renderizan correctamente

## 📈 Ejemplo de Salida

```
=================================================================================
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP056
=================================================================================

📈 DATOS DE LA TABLA:
  • Total de registros: 1500
  • Tamaño de página: 10
  • Total de páginas: 150

⏱️  TIEMPOS DE RESPUESTA:
  • Carga inicial: 2456.78ms (umbral: 3000ms)
  • Renderizado tabla: 1890.34ms (umbral: 3000ms)
  • Cambio de página: 678.12ms (umbral: 1000ms)
  • Búsqueda/filtrado: 1234.56ms (umbral: 2000ms)
  • Recarga manual: 1567.89ms (umbral: 2000ms)

✅ VALIDACIONES:
  ✅ Carga inicial: 2456.78ms / 3000ms
  ✅ Renderizado tabla: 1890.34ms / 3000ms
  ✅ Cambio de página: 678.12ms / 1000ms
  ✅ Búsqueda: 1234.56ms / 2000ms
  ✅ Recarga: 1567.89ms / 2000ms

=================================================================================
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# .env (en el directorio raíz)
BASE_URL=http://localhost:3000       # URL del frontend
ADMIN_EMAIL=admin@admin.com          # Email de administrador
ADMIN_PASSWORD=admin123              # Password de administrador
```

### Ajustar Umbrales de Rendimiento

Editar `cp056-table-rendering.spec.ts`:

```typescript
const PERFORMANCE_THRESHOLDS = {
  initialLoad: 3000,    // Ajustar según necesidad
  tableRender: 3000,
  pageChange: 1000,
  search: 2000,
  refresh: 2000,
};
```

## 🐛 Solución de Problemas

### Error: No se encuentra la tabla
- Verificar que el backend esté corriendo
- Verificar credenciales de autenticación en `test-data/auth.json`

### Error: Menos de 1000 registros
- Ejecutar `generate-test-data.js` para crear más clientes
- Verificar que la base de datos tenga conexión

### Tiempos exceden umbrales
- Verificar recursos del sistema (CPU, RAM)
- Reducir carga del backend
- Considerar ajustar umbrales para tu ambiente

## 📚 Documentación Relacionada

- [README-CP056.md](./README-CP056.md) - Documentación técnica completa
- [SETUP-CP056.md](./SETUP-CP056.md) - Guía de instalación detallada
- [Playwright Docs](https://playwright.dev/) - Documentación oficial de Playwright

## 🤝 Contribuir

Para reportar problemas o sugerir mejoras, ver [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 Licencia

Este proyecto está bajo la licencia especificada en [LICENSE](../../LICENSE)
