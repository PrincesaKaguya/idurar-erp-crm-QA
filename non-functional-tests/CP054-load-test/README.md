# 🚀 Pruebas de Rendimiento - IDURAR ERP/CRM

## 📋 Descripción General

Este directorio contiene **pruebas no funcionales** de carga y rendimiento para evaluar el comportamiento del sistema IDURAR bajo diferentes condiciones de estrés y concurrencia.

## 🎯 Objetivos

Evaluar atributos de calidad del sistema:
- ✅ **Rendimiento**: Tiempos de respuesta bajo carga
- ✅ **Fiabilidad**: Estabilidad y tasa de errores
- ✅ **Compatibilidad**: Manejo de usuarios concurrentes
- ✅ **Escalabilidad**: Capacidad de crecimiento

## 🛠️ Herramienta Utilizada

**k6** (https://k6.io/) - Framework open-source especializado en pruebas de carga y rendimiento.

### ¿Por qué k6?
- ✓ Escrito en Go, alto rendimiento
- ✓ Scripts en JavaScript (ES6+)
- ✓ Métricas detalladas en tiempo real
- ✓ Umbrales configurables (pass/fail)
- ✓ Gratuito y open-source

---

## 📂 Estructura de Archivos

```
performance/
├── README.md                    # Este archivo (índice general)
├── README-CP054.md             # Documentación técnica completa CP054
├── SETUP-CP054.md              # Guía de instalación y ejecución
├── cp054-load-test.js          # Script de prueba de carga (40-50 usuarios)
└── cp054-results.json          # Resultados de la última ejecución (generado)
```

---

## 📊 Casos de Prueba Disponibles

### CP054: Simulación de 40 Usuarios Concurrentes ⭐
**Tipo**: Prueba de Carga (Load Testing)  
**Usuarios**: 40-50 concurrentes  
**Duración**: ~5 minutos  
**Estado**: ✅ Implementado

**Perfil de Carga**:
1. Ramp-up: 0 → 10 usuarios (30s)
2. Carga media: 20 usuarios (1m)
3. Carga objetivo: 40 usuarios (2m) ⭐
4. Sobrecarga: 50 usuarios (1m)
5. Ramp-down: 50 → 0 usuarios (30s)

**Operaciones Simuladas**:
- 70% Consultas: Listar clientes, facturas, quotes, dashboard
- 30% Registros: Crear clientes

**Umbrales de Éxito**:
- ✓ p95 response time < 2000ms
- ✓ Error rate < 5%
- ✓ HTTP failures < 5%

---

## 🚀 Inicio Rápido

### 1. Instalar k6

**Windows (PowerShell como Admin)**:
```powershell
choco install k6
```

**Verificar**:
```powershell
k6 version
```

### 2. Ejecutar Prueba

```powershell
# Asegurar que backend esté corriendo
cd backend
npm run setup

# En otra terminal, ejecutar prueba
cd e2e-tests
npm run load:cp054
```

### 3. Ver Resultados

Los resultados se muestran en consola y se guardan en:
- `performance/cp054-results.json`

---

## 📖 Documentación Detallada

| Archivo | Contenido |
|---------|-----------|
| **README-CP054.md** | Documentación técnica completa, métricas, interpretación |
| **SETUP-CP054.md** | Guía paso a paso de instalación y troubleshooting |
| **cp054-load-test.js** | Código fuente del script (comentado) |

---

## 📈 Ejemplo de Resultados

```
✓ CP054 - Load Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scenarios:
  • Total iterations: 450
  • Total time: 300.00s

HTTP Metrics:
  • Requests: 2250
  • Failed requests: 1.2%
  • Request duration (avg): 245.50ms
  • Request duration (p95): 1850.00ms ✓
  • Request duration (max): 2100.00ms

Virtual Users:
  • Max concurrent VUs: 50 ✓
  • Active VUs at end: 0

Errors:
  • Error rate: 1.5% ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TEST PASSED - Todos los umbrales cumplidos
```

---

## 🎯 Criterios de Evaluación

### ✅ PASS (Sistema Aceptable)
- http_req_duration (p95) < 2000ms
- Error rate < 5%
- Sistema estable durante toda la prueba
- Sin crashes ni timeouts masivos

### ✗ FAIL (Sistema Requiere Optimización)
- http_req_duration (p95) > 2000ms
- Error rate > 5%
- Sistema colapsa o se degrada significativamente
- Timeouts frecuentes o errores de conexión

---

## 🔧 Scripts NPM Disponibles

```bash
# Ejecutar prueba completa CP054 (~5 min)
npm run load:cp054

# Ejecutar prueba rápida (10 usuarios, 1 min)
npm run load:cp054-quick
```

---

## 📊 Métricas Clave Explicadas

### http_req_duration
Tiempo total de la petición HTTP (envío + espera + recepción).
- **avg**: Promedio - idealmente < 500ms
- **p(95)**: 95 percentil - **umbral crítico < 2000ms**
- **max**: Peor caso - debe ser razonable

### http_req_failed
Porcentaje de peticiones HTTP que retornan error (4xx, 5xx).
- **Umbral**: < 5%

### errors (custom metric)
Tasa de errores en checks de validación (login, data, etc).
- **Umbral**: < 5%

### iterations
Número de ciclos completos ejecutados por usuarios virtuales.
- **Mayor = mejor throughput**

---

## 🐛 Solución de Problemas

### "k6: command not found"
```powershell
choco install k6 -y
```

### "ECONNREFUSED"
Backend no está corriendo. Iniciar con:
```powershell
cd backend
npm run setup
```

### "401 Unauthorized"
Verificar credenciales en `cp054-load-test.js`:
```javascript
const USERNAME = 'admin@demo.com';
const PASSWORD = 'admin123';
```

### Alta tasa de errores
Sistema sobrecargado. Opciones:
1. Reducir VUs: `k6 run --vus 20 performance/cp054-load-test.js`
2. Optimizar base de datos
3. Aumentar recursos del servidor

---

## 🔮 Futuras Pruebas Planificadas

### CP055 - Prueba de Estrés
- **Usuarios**: 100+ concurrentes
- **Objetivo**: Encontrar punto de quiebre del sistema

### CP056 - Prueba de Estabilidad
- **Duración**: 30-60 minutos
- **Carga**: 20 usuarios sostenidos
- **Objetivo**: Detectar memory leaks y degradación

### CP057 - Prueba de Picos
- **Patrón**: Spikes repentinos de usuarios
- **Objetivo**: Evaluar recuperación ante tráfico irregular

### CP058 - Prueba de Saturación
- **Incremento**: Gradual hasta 200+ usuarios
- **Objetivo**: Determinar capacidad máxima del sistema

---

## 📚 Recursos Adicionales

- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/test-types/load-testing/)
- [k6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/api-load-testing/)

---

## 👥 Equipo

**QA Team** - IDURAR ERP/CRM  
Pruebas No Funcionales - Rendimiento y Carga

---

## 📅 Historial

| Fecha | Caso | Estado | Notas |
|-------|------|--------|-------|
| 2025-11-19 | CP054 | ✅ Implementado | Prueba de 40-50 usuarios concurrentes |

---

**Última actualización**: 19 de Noviembre, 2025
