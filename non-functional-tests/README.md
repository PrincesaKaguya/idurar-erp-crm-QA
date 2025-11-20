# 🔬 Pruebas No Funcionales - IDURAR ERP/CRM

Este directorio contiene **pruebas de caja negra no funcionales** que evalúan atributos de calidad del sistema distintos a la funcionalidad.

## 📋 Tipos de Pruebas No Funcionales

Las pruebas en este directorio evalúan:
- ⚡ **Rendimiento**: Tiempos de respuesta y throughput
- 🚀 **Carga**: Comportamiento bajo múltiples usuarios
- 💪 **Estrés**: Límites del sistema
- 🔄 **Estabilidad**: Operación prolongada
- 🔐 **Seguridad**: Protección de datos
- 📱 **Usabilidad**: Experiencia de usuario
- 🌐 **Compatibilidad**: Diferentes entornos
- 🔧 **Mantenibilidad**: Facilidad de mantenimiento

---

## 📂 Estructura de Carpetas

```
non-functional-tests/
├── README.md                    # Este archivo (índice general)
│
├── CP054-load-test/             # Prueba de Carga - 40 Usuarios
│   ├── README.md                # Overview de CP054
│   ├── README-CP054.md          # Documentación técnica completa
│   ├── SETUP-CP054.md           # Guía de instalación y ejecución
│   ├── EXECUTIVE-SUMMARY-CP054.md  # Resumen ejecutivo
│   ├── cp054-load-test.js       # Script k6
│   └── cp054-results.json       # Resultados (generado)
│
├── CP055-bulk-invoices/         # ✅ Carga Masiva de Facturas
│   ├── README.md                # Overview de CP055
│   ├── README-CP055.md          # Documentación técnica completa
│   ├── SETUP-CP055.md           # Guía de instalación y ejecución
│   ├── cp055-bulk-invoices.js   # Script k6
│   └── get-test-ids.js          # Helper: Obtener IDs de BD
│
├── CP056-table-rendering/       # ✅ Rendimiento de Tabla (1000+ registros)
│   ├── README.md                # Overview de CP056
│   ├── README-CP056.md          # Documentación técnica completa
│   ├── SETUP-CP056.md           # Guía de instalación y ejecución
│   ├── cp056-table-rendering.spec.ts  # Test Playwright
│   └── generate-test-data.js    # Generador de 1500+ clientes
│
└── [Futuras pruebas...]
    ├── CP057-stress-test/       # 🔜 Prueba de Estrés (100+ usuarios)
    ├── CP058-stability-test/    # 🔜 Prueba de Estabilidad (30 min)
    ├── CP059-spike-test/        # 🔜 Prueba de Picos
    └── CP060-security-test/     # 🔜 Pruebas de Seguridad
```

---

## 🧪 Casos de Prueba Disponibles

### ✅ CP054: Prueba de Carga - 40 Usuarios Concurrentes

**Tipo**: Load Testing (Prueba de Carga)  
**Estado**: ✅ Implementado  
**Herramienta**: k6 (https://k6.io/)

#### Descripción
Evalúa el comportamiento del sistema ante **40-50 usuarios conectados simultáneamente** realizando operaciones de consulta y registro.

#### Atributos Evaluados
- **Rendimiento**: Tiempo de respuesta bajo carga
- **Fiabilidad**: Tasa de errores y estabilidad
- **Compatibilidad**: Manejo de concurrencia
- **Escalabilidad**: Capacidad de atender usuarios

#### Perfil de Carga
| Fase | Duración | Usuarios | Descripción |
|------|----------|----------|-------------|
| 1 | 30s | 0 → 10 | Ramp-up gradual |
| 2 | 1m | 20 | Carga media sostenida |
| 3 | 2m | **40** | **Carga objetivo** ⭐ |
| 4 | 1m | 50 | Sobrecarga |
| 5 | 30s | 50 → 0 | Ramp-down |

**Duración Total**: ~5 minutos

#### Operaciones Simuladas
- 70% Consultas: Listar clientes, facturas, quotes, dashboard
- 30% Registros: Crear clientes

#### Umbrales de Éxito
- ✓ 95% de requests < 2000ms
- ✓ Error rate < 5%
- ✓ HTTP failures < 5%

#### Ejecución Rápida
```bash
# Desde raíz del proyecto
cd non-functional-tests/CP054-load-test

# Ejecutar prueba completa (~5 min)
k6 run cp054-load-test.js

# Ejecutar prueba rápida (10 usuarios, 1 min)
k6 run --vus 10 --duration 1m cp054-load-test.js
```

#### Documentación
- 📖 [README.md](CP054-load-test/README.md) - Overview
- 📘 [README-CP054.md](CP054-load-test/README-CP054.md) - Documentación técnica
- 📗 [SETUP-CP054.md](CP054-load-test/SETUP-CP054.md) - Instalación y troubleshooting
- 📊 [EXECUTIVE-SUMMARY-CP054.md](CP054-load-test/EXECUTIVE-SUMMARY-CP054.md) - Resumen ejecutivo

---

### ✅ CP055: Carga Masiva de Facturas

**Tipo**: Load Testing - Bulk Operations  
**Estado**: ✅ Implementado  
**Herramienta**: k6 (https://k6.io/)

#### Descripción
Valida que el sistema permita la **carga simultánea de múltiples facturas** por varios usuarios concurrentes, evaluando rendimiento, fiabilidad e integridad de datos.

#### Atributos Evaluados
- **Rendimiento**: Tiempo de respuesta bajo carga masiva de escritura
- **Fiabilidad**: Tasa de éxito en operaciones concurrentes
- **Integridad**: Consistencia de datos (números únicos)
- **Escalabilidad**: Capacidad de manejar múltiples escrituras simultáneas

#### Perfil de Carga
| Fase | Duración | Usuarios | Facturas/Usuario | Descripción |
|------|----------|----------|------------------|-------------|
| 1 | 30s | 0 → 5 | 3-5 | Warm-up |
| 2 | 1m | 5 → 15 | 3-5 | Carga gradual |
| 3 | 2m | 15 → 25 | 3-5 | **Carga masiva** ⭐ |
| 4 | 1m | 25 → 30 | 3-5 | Pico de carga |
| 5 | 30s | 30 → 0 | - | Cooldown |

**Duración Total**: ~5 minutos  
**Facturas Esperadas**: ~300-500 facturas creadas

#### Operaciones Simuladas
- 100% Escrituras: Creación de facturas con items aleatorios
- Cada factura: 1-4 items, clientes/impuestos aleatorios

#### Umbrales de Éxito
- ✓ 95% de creaciones < 3000ms
- ✓ Error rate < 3%
- ✓ HTTP failures < 1%
- ✓ **Números de factura duplicados = 0** (crítico)

#### Ejecución Rápida
```bash
# Desde raíz del proyecto
cd non-functional-tests/CP055-bulk-invoices

# IMPORTANTE: Actualizar IDs en cp055-bulk-invoices.js líneas 30-46

# Ejecutar prueba completa (~5 min)
k6 run cp055-bulk-invoices.js

# Ejecutar prueba rápida (10 usuarios, 1 min)
k6 run --vus 10 --duration 1m cp055-bulk-invoices.js

# Verificar en MongoDB
mongosh
use idurar
db.invoices.countDocuments({ notes: { $regex: /prueba de carga/ } })
```

#### Documentación
- 📖 [README.md](CP055-bulk-invoices/README.md) - Overview y quick start
- 📘 [README-CP055.md](CP055-bulk-invoices/README-CP055.md) - Documentación técnica completa
- 📗 [SETUP-CP055.md](CP055-bulk-invoices/SETUP-CP055.md) - Instalación, configuración y troubleshooting

---

### ✅ CP056: Rendimiento de Renderizado de Tabla de Clientes

**Tipo**: Performance Testing - UI Rendering  
**Estado**: ✅ Implementado  
**Herramienta**: Playwright (https://playwright.dev/)

#### Descripción
Evalúa el **rendimiento de renderizado de la tabla de clientes** del sistema cuando contiene **más de 1000 registros**, midiendo tiempos de carga, paginación, búsqueda y correctitud visual.

#### Atributos Evaluados
- **Rendimiento**: Tiempos de respuesta de UI con datasets grandes
- **Usabilidad**: Experiencia de usuario sin bloqueos o lag
- **Fiabilidad**: Correcta visualización de todos los elementos
- **Escalabilidad**: Capacidad de manejar 1000+ registros en frontend

#### Métricas Evaluadas
| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| **Carga Inicial** | < 3000ms | Tiempo desde navegación hasta tabla renderizada |
| **Renderizado Tabla** | < 3000ms | Tiempo de renderizado completo de elementos |
| **Cambio de Página** | < 1000ms | Tiempo de respuesta al cambiar página |
| **Búsqueda/Filtrado** | < 2000ms | Tiempo de respuesta a búsquedas |
| **Recarga Manual** | < 2000ms | Tiempo de recarga con botón Refresh |

#### Casos de Prueba
- **CP056-01**: Medir tiempo de carga inicial de tabla
- **CP056-02**: Medir tiempo de renderizado de tabla con 1000+ registros
- **CP056-03**: Medir tiempo de cambio de página
- **CP056-04**: Medir tiempo de respuesta de búsqueda
- **CP056-05**: Medir tiempo de recarga manual (refresh)
- **CP056-06**: Verificar correctitud visual con 1000+ registros

#### Datos de Prueba
**Prerequisito**: Base de datos con >= 1000 clientes

```bash
# Generar 1500 clientes de prueba
cd non-functional-tests/CP056-table-rendering
node generate-test-data.js 1500
```

#### Ejecución Rápida
```bash
# Desde raíz del proyecto
cd e2e-tests

# Ejecutar CP056 en Chromium
npm run perf:cp056

# Ejecutar en todos los navegadores
npm run perf:cp056-all

# Ver reporte de métricas
npx playwright show-report
```

#### Ejemplo de Resultados
```
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
```

#### Umbrales de Éxito
- ✓ Carga inicial < 3000ms
- ✓ Cambio de página < 1000ms
- ✓ Búsqueda < 2000ms
- ✓ Todos los elementos UI renderizados correctamente
- ✓ Sin errores visuales o mensajes de error

#### Documentación
- 📖 [README.md](CP056-table-rendering/README.md) - Overview y quick start
- 📘 [README-CP056.md](CP056-table-rendering/README-CP056.md) - Documentación técnica completa
- 📗 [SETUP-CP056.md](CP056-table-rendering/SETUP-CP056.md) - Instalación, configuración y troubleshooting

---

## 🚀 Inicio Rápido

### Requisitos Previos

#### Para Pruebas de Carga (k6)
```bash
# Windows (PowerShell como Admin)
choco install k6

# Linux (Ubuntu/Debian)
sudo apt-get install k6

# macOS
brew install k6

# Verificar instalación
k6 version
```

### Ejecutar Primera Prueba (CP054)

```bash
# 1. Asegurar que backend esté corriendo
cd backend
npm run setup

# 2. En otra terminal, ejecutar prueba
cd non-functional-tests/CP054-load-test
k6 run cp054-load-test.js
```

---

## 📊 Comparación de Pruebas

| Caso | Tipo | Usuarios | Duración | Operaciones | Objetivo | Estado |
|------|------|----------|----------|-------------|----------|--------|
| **CP054** | Load | 40-50 | 5 min | 70% lectura, 30% escritura | Validar capacidad normal | ✅ Listo |
| **CP055** | Load - Bulk | 25-30 | 5 min | 100% escritura (facturas) | Carga masiva escritura | ✅ Listo |
| **CP056** | Performance - UI | 1 usuario | 2 min | Renderizado tabla (1000+) | Medir tiempos de UI | ✅ Listo |
| **CP057** | Stress | 100+ | 10 min | Mixtas | Encontrar punto de quiebre | 🔜 Planificado |
| **CP058** | Stability | 20 | 30 min | Mixtas | Detectar memory leaks | 🔜 Planificado |
| **CP059** | Spike | Variable | 5 min | Mixtas | Evaluar recuperación | 🔜 Planificado |
| **CP060** | Security | - | - | Pentest | Vulnerabilidades | 🔜 Planificado |

---

## 📈 Resultados Esperados

### Ejemplo: CP054 Load Test
```
✓ CP054 - Load Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HTTP Metrics:
  • Requests: 2250
  • Failed requests: 1.2% ✓
  • Request duration (avg): 245ms
  • Request duration (p95): 1850ms ✓
  • Request duration (max): 2100ms

Virtual Users:
  • Max concurrent VUs: 50 ✓

Errors:
  • Error rate: 1.5% ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TEST PASSED - Sistema soporta 40-50 usuarios concurrentes
```

---

## 🎯 Criterios de Evaluación

### ✅ PASS (Sistema Aceptable)
- Métricas dentro de umbrales definidos
- Sistema estable durante toda la prueba
- Sin crashes ni degradación crítica
- Recuperación adecuada post-carga

### ✗ FAIL (Requiere Optimización)
- Métricas fuera de umbrales (>2s, >5% error)
- Sistema colapsa o se degrada significativamente
- Timeouts masivos o errores de conexión
- No recupera estado normal post-carga

---

## 🔧 Herramientas Utilizadas

### k6 - Load Testing
- **Tipo**: Framework de pruebas de carga y rendimiento
- **Licencia**: Open Source (AGPL v3)
- **Lenguaje**: JavaScript (ES6+)
- **Website**: https://k6.io/
- **Uso**: CP054 (Load Test), CP055 (Bulk Operations)

**Ventajas**:
- ✓ Alto rendimiento (escrito en Go)
- ✓ Scripts en JavaScript familiar
- ✓ Métricas detalladas en tiempo real
- ✓ Umbrales configurables (pass/fail)
- ✓ Integración CI/CD

### Playwright - UI Performance Testing
- **Tipo**: Framework de automatización de navegadores
- **Licencia**: Open Source (Apache 2.0)
- **Lenguaje**: TypeScript/JavaScript
- **Website**: https://playwright.dev/
- **Uso**: CP056 (UI Rendering Performance)

**Ventajas**:
- ✓ Soporte multi-navegador (Chromium, Firefox, WebKit)
- ✓ API moderna con async/await
- ✓ Auto-wait para elementos
- ✓ Trace viewer para debugging
- ✓ Medición precisa con `performance.now()`

---

## 📚 Buenas Prácticas

### Diseño de Pruebas
1. **Definir objetivos claros**: ¿Qué atributo evaluar?
2. **Establecer umbrales realistas**: Basados en SLAs
3. **Simular comportamiento real**: Operaciones reales de usuarios
4. **Pruebas incrementales**: Empezar con carga baja

### Ejecución
1. **Ambiente limpio**: Sin otros procesos pesados
2. **Múltiples ejecuciones**: Obtener promedio confiable
3. **Monitorear recursos**: CPU, RAM, Disco, Red
4. **Documentar resultados**: Fecha, condiciones, métricas

### Análisis
1. **Comparar con baseline**: Detectar regresiones
2. **Identificar cuellos de botella**: Queries lentas, N+1, etc.
3. **Priorizar optimizaciones**: Alto impacto primero
4. **Validar mejoras**: Re-ejecutar post-optimización

---

## 🔮 Roadmap de Pruebas No Funcionales

### Fase 1: Rendimiento y Carga ✅
- [x] CP054: Load Test (40-50 usuarios concurrentes)
- [x] CP055: Bulk Load Test (carga masiva de facturas)

### Fase 2: Estrés y Estabilidad 🔜
- [ ] CP056: Stress Test (100+ usuarios)
- [ ] CP057: Stability Test (30 min sostenido)
- [ ] CP058: Spike Test (picos repentinos)

### Fase 3: Seguridad 🔜
- [ ] CP059: Security Test (OWASP Top 10)
- [ ] CP060: Authentication Test
- [ ] CP061: Authorization Test

### Fase 4: Usabilidad 🔜
- [ ] CP062: UI Responsiveness (< 100ms)
- [ ] CP063: Navigation Flow
- [ ] CP064: Accessibility (WCAG 2.1)

### Fase 5: Compatibilidad 🔜
- [ ] CP065: Browser Compatibility (Chrome, Firefox, Safari, Edge)
- [ ] CP066: Mobile Responsiveness

### Fase 5: Compatibilidad 🔜
- [ ] CP064: Cross-browser Testing
- [ ] CP065: Mobile/Tablet Testing
- [ ] CP066: API Version Compatibility

---

## 📊 Métricas Clave por Tipo de Prueba

### Rendimiento/Carga
- **Response Time**: avg, p50, p95, p99, max
- **Throughput**: requests/segundo
- **Error Rate**: % de errores
- **Concurrency**: usuarios simultáneos

### Estrés
- **Breaking Point**: # usuarios antes de colapso
- **Degradation**: % degradación por usuario
- **Recovery Time**: tiempo recuperación post-estrés

### Estabilidad
- **Memory Usage**: tendencia en el tiempo
- **CPU Usage**: sostenibilidad
- **Error Rate**: incremento gradual
- **Resource Leaks**: detección de fugas

### Seguridad
- **Vulnerabilities**: # encontradas
- **CVSS Score**: severidad promedio
- **Compliance**: % cumplimiento estándares

---

## 🐛 Solución de Problemas Comunes

### "k6: command not found"
```bash
# Instalar k6
choco install k6  # Windows
brew install k6   # macOS
apt install k6    # Linux
```

### "Backend no responde"
```bash
# Verificar que backend esté corriendo
curl http://localhost:8888/api/health

# Reiniciar si es necesario
cd backend
npm run setup
```

### "Resultados inconsistentes"
- Cerrar aplicaciones pesadas
- Ejecutar 3+ veces y promediar
- Usar mismo ambiente/hardware
- Verificar carga de red externa

---

## 📞 Contacto y Soporte

### Documentación
Cada carpeta de prueba contiene su propia documentación:
- `README.md` - Overview general
- `README-CPxxx.md` - Documentación técnica completa
- `SETUP-CPxxx.md` - Guía de instalación y troubleshooting
- `EXECUTIVE-SUMMARY-CPxxx.md` - Resumen ejecutivo

### Recursos Externos
- [k6 Documentation](https://k6.io/docs/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Web Performance Best Practices](https://web.dev/performance/)

---

## 👥 Equipo

**QA Team** - IDURAR ERP/CRM  
Pruebas No Funcionales

---

## 📄 Licencia

Same license as main IDURAR project.

---

**Última actualización**: 19 de Noviembre, 2025
