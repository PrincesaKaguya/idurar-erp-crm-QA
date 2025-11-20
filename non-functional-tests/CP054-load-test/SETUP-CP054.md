# Instrucciones de Instalación y Ejecución - CP054

## 📦 Instalación de k6

### Windows

#### Opción 1: Chocolatey (Recomendado)
```powershell
# Abrir PowerShell como Administrador
choco install k6
```

#### Opción 2: Winget
```powershell
winget install k6 --source winget
```

#### Opción 3: Descarga Manual
1. Ir a https://github.com/grafana/k6/releases
2. Descargar `k6-v0.xx.x-windows-amd64.zip`
3. Extraer en `C:\k6\`
4. Agregar `C:\k6\` al PATH del sistema

#### Verificar Instalación
```powershell
k6 version
# Salida esperada: k6 v0.xx.x
```

---

## 🚀 Ejecución del Test

### 1. Asegurar que el Sistema esté Ejecutándose

#### Terminal 1 - Backend
```powershell
cd C:\Users\zumba\Desktop\qa-YEILYN\idurar-erp-crm\backend
npm run setup
```

Esperar a ver:
```
✓ Backend running on http://localhost:8888
✓ MongoDB connected
```

#### Terminal 2 - Frontend (Opcional, si usas UI)
```powershell
cd C:\Users\zumba\Desktop\qa-YEILYN\idurar-erp-crm\frontend
npm run dev
```

### 2. Ejecutar la Prueba de Carga

#### Terminal 3 - k6
```powershell
cd C:\Users\zumba\Desktop\qa-YEILYN\idurar-erp-crm\e2e-tests
k6 run performance/cp054-load-test.js
```

---

## 📊 Salida Esperada

Durante la ejecución verás:

```
          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: performance/cp054-load-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 50 max VUs, 5m30s max duration
           * default: Up to 50 looping VUs for 5m0s over 5 stages

     ✓ login successful
     ✓ token received
     ✓ customers listed
     ✓ invoices listed
     ✓ quotes listed
     ✓ invoice summary loaded
     ✓ quote summary loaded
     ✓ payment summary loaded
     ✓ customer created

     checks.........................: 98.50% ✓ 2200    ✗ 33
     data_received..................: 5.2 MB 17 kB/s
     data_sent......................: 890 kB 3.0 kB/s
     errors.........................: 1.50%  ✓ 33      ✗ 2167
     http_req_blocked...............: avg=2.5ms    min=0s     med=1ms     max=50ms    p(95)=10ms
     http_req_connecting............: avg=1.8ms    min=0s     med=0s      max=45ms    p(95)=8ms
   ✓ http_req_duration..............: avg=245ms    min=50ms   med=200ms   max=2100ms  p(95)=1850ms
     http_req_failed................: 1.20%  ✓ 27      ✗ 2173
     http_req_receiving.............: avg=0.5ms    min=0s     med=0.3ms   max=15ms    p(95)=2ms
     http_req_sending...............: avg=0.2ms    min=0s     med=0.1ms   max=8ms     p(95)=1ms
     http_req_tls_handshaking.......: avg=0s       min=0s     med=0s      max=0s      p(95)=0s
     http_req_waiting...............: avg=244ms    min=49ms   med=199ms   max=2095ms  p(95)=1845ms
     http_reqs......................: 2200   7.3/s
     iteration_duration.............: avg=12s      min=5s     med=11s     max=20s     p(95)=18s
     iterations.....................: 450    1.5/s
     vus............................: 0      min=0     max=50
     vus_max........................: 50     min=50    max=50

running (5m00.0s), 00/50 VUs, 450 complete and 0 interrupted iterations
default ✓ [======================================] 00/50 VUs  5m0s
```

---

## ✅ Interpretación de Resultados

### ✓ Prueba EXITOSA si:
```
✓ http_req_duration (p95): < 2000ms    [Actual: 1850ms ✓]
✓ errors: < 5%                         [Actual: 1.5% ✓]
✓ http_req_failed: < 5%                [Actual: 1.2% ✓]
✓ Sistema estable con 50 VUs           [Actual: ✓]
```

### ✗ Prueba FALLIDA si:
```
✗ http_req_duration (p95): > 2000ms    [Necesita optimización]
✗ errors: > 5%                         [Sistema inestable]
✗ http_req_failed: > 5%                [Problemas de backend]
✗ Crashes o timeouts frecuentes        [Sistema sobrecargado]
```

---

## 🔧 Solución de Problemas Comunes

### 1. Error: "k6: command not found"
**Problema**: k6 no está instalado o no está en PATH

**Solución**:
```powershell
# Reinstalar k6
choco install k6 -y

# Verificar instalación
k6 version
```

---

### 2. Error: "ECONNREFUSED"
**Problema**: Backend no está ejecutándose

**Solución**:
```powershell
# Verificar que backend esté corriendo
curl http://localhost:8888/api/health

# Si no responde, iniciar backend
cd backend
npm run setup
```

---

### 3. Error: "401 Unauthorized" masivo
**Problema**: Credenciales incorrectas o base de datos vacía

**Solución**:
```javascript
// Editar performance/cp054-load-test.js líneas 90-91
const USERNAME = 'admin@demo.com';  // Verificar email correcto
const PASSWORD = 'admin123';        // Verificar password correcto
```

---

### 4. Alta tasa de errores (> 10%)
**Problema**: Sistema sobrecargado o base de datos lenta

**Solución**:
```powershell
# Reducir carga inicial
k6 run --vus 20 --duration 2m performance/cp054-load-test.js

# Revisar logs del backend
cd backend
# Ver últimos logs para errores
```

---

### 5. Test muy lento o colgado
**Problema**: Timeouts o recursos insuficientes

**Solución**:
```javascript
// Editar cp054-load-test.js, agregar timeout:
export const options = {
  // ... configuración existente
  httpDebug: 'full',
  timeout: '60s',  // Agregar esta línea
};
```

---

## 📊 Generar Reportes Avanzados

### Exportar Resultados a JSON
```powershell
k6 run --out json=performance/results.json performance/cp054-load-test.js
```

### Exportar a CSV (requiere extensión)
```powershell
k6 run --out csv=performance/results.csv performance/cp054-load-test.js
```

### Visualización con Grafana (Avanzado)
```powershell
# Requiere Docker
docker run -d -p 3000:3000 grafana/grafana
k6 run --out influxdb=http://localhost:8086/k6 performance/cp054-load-test.js
```

---

## 🎯 Próximas Pruebas Recomendadas

Después de validar CP054, ejecutar:

### CP055 - Prueba de Estrés (100 usuarios)
```powershell
# Editar cp054-load-test.js:
# Cambiar stage 3: { duration: '2m', target: 100 }
k6 run performance/cp055-stress-test.js
```

### CP056 - Prueba de Estabilidad (30 min)
```powershell
# Carga sostenida de 20 usuarios por 30 minutos
k6 run --vus 20 --duration 30m performance/cp056-stability-test.js
```

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del backend en terminal 1
2. Verificar conectividad: `curl http://localhost:8888/api/health`
3. Revisar README-CP054.md para más detalles
4. Ajustar umbrales si sistema es más lento

---

## ✨ Tips para Mejores Resultados

1. **Cerrar aplicaciones pesadas** antes de ejecutar
2. **Ejecutar en modo Release** del backend (no desarrollo)
3. **Usar base de datos con datos reales** para pruebas más precisas
4. **Monitorear recursos del sistema** (CPU, RAM, Disco) durante la prueba
5. **Ejecutar múltiples veces** para obtener promedio confiable

---

Última actualización: 19 de Noviembre, 2025
