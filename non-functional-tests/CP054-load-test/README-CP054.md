# CP054: Simulación de 40 Usuarios Concurrentes

## 📋 Descripción
Prueba de carga no funcional que evalúa el comportamiento del sistema ante 40-50 usuarios conectados simultáneamente realizando operaciones de consulta y registro.

## 🎯 Objetivo
Evaluar los atributos de calidad del sistema en términos de:
- **Rendimiento**: Tiempo de respuesta bajo carga
- **Fiabilidad**: Tasa de errores aceptable
- **Compatibilidad**: Manejo de concurrencia
- **Escalabilidad**: Capacidad de atender múltiples usuarios

## 🔧 Herramienta
**k6** - Framework de pruebas de carga y rendimiento (https://k6.io/)

## ✅ Precondiciones
1. Sistema IDURAR ejecutándose en `http://localhost:8888`
2. Backend y Frontend operativos
3. Base de datos con datos de prueba
4. k6 instalado en el sistema

## 📦 Instalación de k6

### Windows (PowerShell)
```powershell
# Usando Chocolatey
choco install k6

# O usando winget
winget install k6 --source winget
```

### Linux
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### macOS
```bash
brew install k6
```

---

## 🧪 Escenarios de Prueba

### Perfil de Carga
La prueba simula un aumento gradual de usuarios:

| Fase | Duración | Usuarios | Descripción |
|------|----------|----------|-------------|
| 1. Ramp-up | 30s | 0 → 10 | Incremento gradual inicial |
| 2. Carga Media | 1m | 20 | Carga sostenida moderada |
| 3. Pico de Carga | 2m | 40 | **Carga objetivo (40 usuarios)** |
| 4. Sobrecarga | 1m | 50 | Prueba de límite superior |
| 5. Ramp-down | 30s | 50 → 0 | Reducción gradual |

**Duración total**: ~5 minutos

### Operaciones Simuladas

#### Operaciones de Consulta (70% del tráfico):
1. **Listar Clientes** - `GET /api/client/list?page=1&items=10`
2. **Listar Facturas** - `GET /api/invoice/list?page=1&items=10`
3. **Listar Presupuestos** - `GET /api/quote/list?page=1&items=10`
4. **Dashboard Summary** - `GET /api/invoice/summary`, `/api/quote/summary`, `/api/payment/summary`

#### Operaciones de Registro (30% del tráfico):
5. **Crear Cliente** - `POST /api/client/create`

---

## 📊 Métricas Evaluadas

### Umbrales de Rendimiento Aceptable

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| **http_req_duration (p95)** | < 2000ms | 95% de peticiones en < 2s |
| **Error Rate** | < 5% | Máximo 5% de errores |
| **http_req_failed** | < 5% | Máximo 5% de fallos HTTP |

### Métricas Reportadas

1. **Rendimiento**:
   - Request duration (avg, p95, max)
   - Requests por segundo (RPS)
   - Tiempo de respuesta bajo carga

2. **Fiabilidad**:
   - Tasa de errores
   - Requests fallidos
   - Autenticaciones exitosas

3. **Concurrencia**:
   - Usuarios virtuales máximos
   - Iteraciones totales
   - Throughput

---

## 🚀 Ejecución

### Comando Principal
```bash
cd e2e-tests
k6 run performance/cp054-load-test.js
```

### Opciones Avanzadas

```bash
# Ejecutar con menos usuarios (prueba rápida)
k6 run --vus 10 --duration 30s performance/cp054-load-test.js

# Ejecutar con más duración
k6 run --duration 10m performance/cp054-load-test.js

# Generar reporte HTML
k6 run --out json=performance/results.json performance/cp054-load-test.js

# Ejecutar con salida detallada
k6 run --verbose performance/cp054-load-test.js
```

---

## 📈 Interpretación de Resultados

### ✅ Criterios de Éxito

**PASS** si:
- ✓ http_req_duration (p95) < 2000ms
- ✓ Error rate < 5%
- ✓ http_req_failed < 5%
- ✓ Sistema mantiene estabilidad con 40-50 usuarios

**FAIL** si:
- ✗ Tiempo de respuesta p95 > 2000ms
- ✗ Tasa de error > 5%
- ✗ Sistema colapsa o se vuelve inestable

### Ejemplo de Salida Exitosa
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
  • Request duration (p95): 1850.00ms
  • Request duration (max): 2100.00ms

Virtual Users:
  • Max concurrent VUs: 50
  • Active VUs at end: 0

Errors:
  • Error rate: 1.5%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Análisis de Resultados

### Métricas Clave a Analizar

1. **http_req_duration**:
   - `avg`: Tiempo promedio - objetivo < 1000ms
   - `p(95)`: 95% de requests - objetivo < 2000ms
   - `max`: Peor caso - debe ser razonable

2. **http_req_failed**:
   - Porcentaje de requests HTTP fallidos
   - Objetivo: < 5%

3. **iterations**:
   - Total de ciclos completados por los VUs
   - Indica throughput del sistema

4. **vus_max**:
   - Máximo de usuarios concurrentes alcanzado
   - Debe llegar a 50 en fase 4

---

## 📝 Notas Técnicas

### Configuración del Test

```javascript
// Fases de carga
stages: [
  { duration: '30s', target: 10 },  // Warm-up
  { duration: '1m', target: 20 },   // Carga media
  { duration: '2m', target: 40 },   // Carga objetivo
  { duration: '1m', target: 50 },   // Sobrecarga
  { duration: '30s', target: 0 },   // Cool-down
]

// Umbrales
thresholds: {
  http_req_duration: ['p(95)<2000'],
  errors: ['rate<0.05'],
  http_req_failed: ['rate<0.05'],
}
```

### Credenciales de Prueba
```javascript
USERNAME: 'admin@demo.com'
PASSWORD: 'admin123'
BASE_URL: 'http://localhost:8888'
```

---

## 🐛 Solución de Problemas

### Error: "connection refused"
**Causa**: Backend no está ejecutándose  
**Solución**: Iniciar backend con `npm run setup` en `/backend`

### Error: "401 Unauthorized"
**Causa**: Credenciales incorrectas o token expirado  
**Solución**: Verificar credenciales en el script

### Error: "ECONNRESET"
**Causa**: Sistema sobrecargado o timeout  
**Solución**: Reducir número de VUs o aumentar timeouts

### Alta tasa de errores (> 5%)
**Causa**: Sistema no soporta la carga  
**Solución**: 
- Optimizar consultas de base de datos
- Aumentar recursos del servidor
- Implementar caché
- Revisar logs del backend

---

## 📊 Archivos Generados

### Resultados JSON
- **Ubicación**: `performance/cp054-results.json`
- **Contenido**: Métricas completas de la ejecución
- **Uso**: Análisis posterior con herramientas de visualización

---

## 🔗 Recursos Adicionales

- [Documentación oficial de k6](https://k6.io/docs/)
- [k6 Load Testing Guide](https://k6.io/docs/test-types/load-testing/)
- [k6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)

---

## 👥 Autor
QA Team - IDURAR ERP/CRM

## 📅 Fecha de Creación
19 de Noviembre, 2025

---

## 📌 Próximos Pasos

Después de ejecutar CP054, considera:
1. **CP055**: Prueba de estrés (incrementar hasta 100+ usuarios)
2. **CP056**: Prueba de estabilidad (carga sostenida por 30+ minutos)
3. **CP057**: Prueba de picos (spikes repentinos de usuarios)
4. **CP058**: Prueba de saturación (encontrar punto de quiebre)
