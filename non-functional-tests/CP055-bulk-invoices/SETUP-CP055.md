# CP055: Guía de Instalación y Configuración

## 📦 Instalación de k6

### Windows

#### Opción 1: Instalador MSI (Recomendado)

1. Descargar el instalador desde la página oficial:
   ```
   https://github.com/grafana/k6/releases/latest
   ```

2. Buscar el archivo `k6-vX.X.X-windows-amd64.msi`

3. Ejecutar el instalador y seguir los pasos

4. Verificar la instalación:
   ```powershell
   k6 version
   ```

#### Opción 2: Chocolatey

```powershell
choco install k6
k6 version
```

#### Opción 3: Winget

```powershell
winget install k6 --source winget
k6 version
```

### Linux

#### Ubuntu/Debian

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Fedora/CentOS

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### macOS

#### Homebrew

```bash
brew install k6
k6 version
```

---

## 🔧 Configuración del Entorno

### 1. Preparar Base de Datos

#### Crear Clientes de Prueba

**Opción A: MongoDB Compass**

1. Conectar a tu base de datos MongoDB
2. Seleccionar la colección `clients`
3. Crear 3 clientes:

```json
[
  {
    "company": "Test Client 1",
    "email": "client1@test.com",
    "phone": "123456789",
    "removed": false,
    "enabled": true
  },
  {
    "company": "Test Client 2",
    "email": "client2@test.com",
    "phone": "987654321",
    "removed": false,
    "enabled": true
  },
  {
    "company": "Test Client 3",
    "email": "client3@test.com",
    "phone": "555555555",
    "removed": false,
    "enabled": true
  }
]
```

4. Copiar los `_id` generados

**Opción B: mongosh CLI**

```javascript
mongosh "mongodb://localhost:27017/idurar"

db.clients.insertMany([
  {
    company: "Test Client 1",
    email: "client1@test.com",
    phone: "123456789",
    removed: false,
    enabled: true
  },
  {
    company: "Test Client 2",
    email: "client2@test.com",
    phone: "987654321",
    removed: false,
    enabled: true
  },
  {
    company: "Test Client 3",
    email: "client3@test.com",
    phone: "555555555",
    removed: false,
    enabled: true
  }
])

// Obtener los IDs
db.clients.find({ email: /test.com/ }, { _id: 1, company: 1 })
```

#### Crear Impuestos de Prueba

**MongoDB Compass:**

```json
[
  {
    "taxName": "IVA 21%",
    "taxValue": 21,
    "isDefault": true,
    "removed": false,
    "enabled": true
  },
  {
    "taxName": "IVA 10%",
    "taxValue": 10,
    "isDefault": false,
    "removed": false,
    "enabled": true
  }
]
```

**mongosh CLI:**

```javascript
db.taxes.insertMany([
  {
    taxName: "IVA 21%",
    taxValue: 21,
    isDefault: true,
    removed: false,
    enabled: true
  },
  {
    taxName: "IVA 10%",
    taxValue: 10,
    isDefault: false,
    removed: false,
    enabled: true
  }
])

// Obtener IDs
db.taxes.find({}, { _id: 1, taxName: 1 })
```

### 2. Actualizar Script con IDs Reales

Editar `cp055-bulk-invoices.js` líneas 30-46:

```javascript
// Reemplaza estos IDs con los obtenidos de tu base de datos
const clients = new SharedArray('clients', function () {
  return [
    { id: '673c9a1234567890abcdef01', name: 'Test Client 1' },  // Tu ID real aquí
    { id: '673c9a1234567890abcdef02', name: 'Test Client 2' },  // Tu ID real aquí
    { id: '673c9a1234567890abcdef03', name: 'Test Client 3' },  // Tu ID real aquí
  ];
});

const taxes = new SharedArray('taxes', function () {
  return [
    { id: '673c9b1234567890fedcba01', name: 'IVA 21%', rate: 21 },  // Tu ID real aquí
    { id: '673c9b1234567890fedcba02', name: 'IVA 10%', rate: 10 },  // Tu ID real aquí
  ];
});
```

### 3. Verificar Credenciales de Admin

Editar línea 163 si es necesario:

```javascript
const loginPayload = {
  email: 'admin@demo.com',      // Tu email de admin
  password: 'admin123',         // Tu contraseña
};
```

---

## 🚀 Ejecución de la Prueba

### Pre-requisitos

✅ **Checklist antes de ejecutar:**

```bash
# 1. Verificar k6 instalado
k6 version

# 2. Verificar backend activo
curl http://localhost:8888/api/ping

# 3. Verificar MongoDB activa
# Windows PowerShell:
Get-Process mongod
# Linux/macOS:
ps aux | grep mongod

# 4. Verificar frontend activo (opcional)
curl http://localhost:3000
```

### Comandos de Ejecución

#### Prueba Completa (5 minutos)

```bash
cd c:\Users\zumba\Desktop\qa-YEILYN\idurar-erp-crm\non-functional-tests\CP055-bulk-invoices
k6 run cp055-bulk-invoices.js
```

#### Prueba Rápida (1 minuto, 10 usuarios)

```bash
k6 run --vus 10 --duration 1m cp055-bulk-invoices.js
```

#### Prueba con URL Personalizada

**Windows PowerShell:**
```powershell
$env:BASE_URL="http://192.168.1.100:8888"
k6 run cp055-bulk-invoices.js
```

**Linux/macOS:**
```bash
BASE_URL=http://192.168.1.100:8888 k6 run cp055-bulk-invoices.js
```

#### Exportar Resultados a JSON

```bash
k6 run --out json=cp055-results.json cp055-bulk-invoices.js
```

#### Ejecutar con Más Detalle (Debug)

```bash
k6 run --verbose cp055-bulk-invoices.js
```

---

## 📊 Interpretar la Salida

### Salida Durante la Ejecución

```
          /\      |‾‾| /‾‾/   /‾‾/   
     /\  /  \     |  |/  /   /  /    
    /  \/    \    |     (   /   ‾‾\  
   /          \   |  |\  \ |  (‾)  | 
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: cp055-bulk-invoices.js
     output: -

  scenarios: (100.00%) 1 scenario, 30 max VUs, 5m30s max duration
           ✓ default: 5m30s, 30 max VUs

     ✓ Status 200
     ✓ Respuesta válida
     ✓ Factura tiene ID
     ✓ Número de factura asignado

     checks.........................: 100.00% ✓ 1200      ✗ 0
     data_received..................: 2.1 MB  7.7 kB/s
     data_sent......................: 890 kB  3.3 kB/s
     http_req_duration..............: avg=1.2s   min=500ms med=1.1s max=3.5s p(90)=2.1s p(95)=2.8s
     http_req_failed................: 0.00%   ✓ 0         ✗ 1200
     http_reqs......................: 1200    4.44/s
     invoices_created_total.........: 300     (300 facturas creadas)
     invoice_creation_errors........: 1.33%   (4 errores de 300)
     invoice_creation_duration......: avg=1.1s   min=450ms med=1.0s max=3.2s p(95)=2.5s
     duplicate_invoice_numbers......: 0       (sin duplicados)
     iteration_duration.............: avg=10.5s  min=5.2s  med=9.8s max=18.3s p(90)=15.1s
     iterations.....................: 75      0.28/s
     vus............................: 0       min=0       max=30
     vus_max........................: 30      min=30      max=30
```

### Indicadores de Éxito

| Métrica | Valor Esperado | Significado |
|---------|----------------|-------------|
| `checks` | 100.00% | Todas las validaciones pasaron |
| `http_req_failed` | < 1% | Menos del 1% de errores HTTP |
| `invoice_creation_errors` | < 3% | Menos del 3% de errores de creación |
| `invoice_creation_duration p(95)` | < 3000ms | 95% de facturas creadas en < 3s |
| `duplicate_invoice_numbers` | 0 | Sin duplicados (crítico) |

### Señales de Problemas

❌ **Error: "Falló la autenticación inicial"**
- Verificar credenciales en línea 163
- Verificar backend activo

❌ **Error: "Client not found"**
- IDs de clientes incorrectos en línea 30-38
- Ejecutar query para obtener IDs reales

❌ **Alta tasa de errores (> 10%)**
- Backend sobrecargado (revisar CPU/RAM)
- Base de datos lenta (crear índices)

❌ **p95 > 3000ms**
- Optimizar consultas MongoDB
- Escalar recursos del servidor

---

## 🔍 Validación Post-Ejecución

### Verificar Resultados en MongoDB

```javascript
mongosh "mongodb://localhost:27017/idurar"

// 1. Contar facturas creadas
db.invoices.countDocuments({
  notes: { $regex: /prueba de carga/ },
  created: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // últimos 10 min
})

// 2. Verificar números únicos
db.invoices.aggregate([
  { $group: { _id: "$number", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
// Debe retornar: [] (array vacío)

// 3. Verificar integridad
db.invoices.find({
  notes: { $regex: /prueba de carga/ },
  $or: [
    { items: { $size: 0 } },
    { client: null },
    { total: { $lte: 0 } }
  ]
}).count()
// Debe retornar: 0
```

### Limpiar Datos de Prueba (Opcional)

```javascript
// Eliminar facturas de prueba
db.invoices.deleteMany({
  notes: { $regex: /prueba de carga/ }
})

// Verificar eliminación
db.invoices.countDocuments({
  notes: { $regex: /prueba de carga/ }
})
// Debe retornar: 0
```

---

## 📈 Exportar Resultados

### Formato JSON

```bash
k6 run --out json=cp055-results.json cp055-bulk-invoices.js
```

**Analizar resultados:**
```powershell
# Windows PowerShell - Ver primeras 10 líneas
Get-Content cp055-results.json | Select-Object -First 10

# Linux/macOS
head -10 cp055-results.json
```

### Formato CSV

```bash
k6 run --out csv=cp055-results.csv cp055-bulk-invoices.js
```

### Integración con InfluxDB (Avanzado)

```bash
# 1. Iniciar InfluxDB (Docker)
docker run -d -p 8086:8086 influxdb:1.8

# 2. Ejecutar k6 con output InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 cp055-bulk-invoices.js

# 3. Visualizar en Grafana
# - Agregar datasource InfluxDB
# - Importar dashboard k6 oficial
```

---

## 🛠️ Troubleshooting

### Problema 1: "k6: command not found"

**Solución Windows:**
```powershell
# Verificar PATH
$env:Path -split ';' | Select-String k6

# Reinstalar con instalador MSI
# Reiniciar terminal
```

**Solución Linux/macOS:**
```bash
# Verificar instalación
which k6

# Reinstalar
brew reinstall k6  # macOS
sudo apt-get reinstall k6  # Ubuntu
```

### Problema 2: "Error: Cannot connect to backend"

```powershell
# Verificar backend activo
curl http://localhost:8888/api/ping

# Iniciar backend
cd c:\Users\zumba\Desktop\qa-YEILYN\idurar-erp-crm\backend
npm run dev
```

### Problema 3: "MongoDB connection error"

```powershell
# Verificar MongoDB activa
# Windows:
Get-Service MongoDB
# Si no está activa:
Start-Service MongoDB

# Linux/macOS:
sudo systemctl status mongod
sudo systemctl start mongod
```

### Problema 4: "Alta tasa de errores (> 10%)"

**Diagnóstico:**

1. Revisar logs del backend:
```powershell
# Ver últimas 50 líneas
Get-Content backend\logs\error.log -Tail 50
```

2. Verificar recursos del servidor:
```powershell
# Windows: Task Manager (Ctrl+Shift+Esc)
# Verificar: CPU, RAM, Disco

# Linux/macOS:
htop
docker stats  # Si usas Docker
```

3. Aumentar recursos:
- Cerrar aplicaciones innecesarias
- Escalar instancias de backend
- Optimizar índices MongoDB

---

## 📚 Recursos Adicionales

### Documentación Oficial k6

- **Getting Started:** https://k6.io/docs/getting-started/running-k6/
- **Test Life Cycle:** https://k6.io/docs/using-k6/test-life-cycle/
- **Metrics:** https://k6.io/docs/using-k6/metrics/
- **Thresholds:** https://k6.io/docs/using-k6/thresholds/

### Comunidad k6

- **Forum:** https://community.k6.io/
- **GitHub:** https://github.com/grafana/k6
- **Examples:** https://github.com/grafana/k6-learn

### MongoDB Indexes

```javascript
// Crear índices recomendados
db.invoices.createIndex({ number: 1 }, { unique: true })
db.invoices.createIndex({ client: 1 })
db.invoices.createIndex({ created: -1 })
db.invoices.createIndex({ status: 1 })

// Verificar índices
db.invoices.getIndexes()
```

---

## ✅ Checklist Final

Antes de ejecutar CP055:

- [ ] k6 instalado y funcionando (`k6 version`)
- [ ] Backend activo (`http://localhost:8888`)
- [ ] MongoDB activa con datos de prueba
- [ ] 3 clientes de prueba creados
- [ ] 2 impuestos de prueba creados
- [ ] IDs actualizados en script (líneas 30, 41)
- [ ] Credenciales de admin válidas (línea 163)
- [ ] Índices MongoDB creados
- [ ] Espacio en disco suficiente (> 500 MB)

Después de ejecutar:

- [ ] Todos los umbrales pasados (✓)
- [ ] Cero números duplicados verificados en BD
- [ ] Facturas creadas validadas (300-500)
- [ ] Resultados exportados (JSON/CSV)
- [ ] Logs de backend revisados (sin errores críticos)
- [ ] Datos de prueba limpiados (opcional)

---

**Última actualización:** 2025-11-19  
**Soporte:** QA Team  
**Versión:** 1.0.0
