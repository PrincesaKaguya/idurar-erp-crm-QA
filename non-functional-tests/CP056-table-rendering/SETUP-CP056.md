# CP056 - Guía de Instalación y Configuración

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Paso a Paso](#instalación-paso-a-paso)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Generación de Datos de Prueba](#generación-de-datos-de-prueba)
5. [Ejecución de Pruebas](#ejecución-de-pruebas)
6. [Solución de Problemas](#solución-de-problemas)
7. [FAQ](#faq)

---

## ✅ Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Propósito |
|----------|----------------|-----------|
| **Node.js** | 18.0.0+ | Runtime para ejecutar scripts y Playwright |
| **npm** | 9.0.0+ | Gestor de paquetes |
| **MongoDB** | 5.0+ | Base de datos (debe estar corriendo) |
| **Backend** | N/A | API REST del sistema (debe estar corriendo) |
| **Frontend** | N/A | Aplicación React (debe estar corriendo) |

### Verificar Instalaciones

```powershell
# Verificar Node.js
node --version
# Salida esperada: v18.x.x o superior

# Verificar npm
npm --version
# Salida esperada: 9.x.x o superior

# Verificar MongoDB (debe estar corriendo)
mongosh --eval "db.version()"
# Salida esperada: 5.x.x o superior
```

### Servicios Corriendo

Antes de ejecutar CP056, asegúrate de que estos servicios estén activos:

```powershell
# 1. MongoDB
# Iniciar MongoDB (si no está corriendo)
# Windows: Verificar en Services o ejecutar:
net start MongoDB

# 2. Backend (API)
# Desde el directorio backend/
cd backend
npm run dev
# Debe estar escuchando en http://localhost:8888

# 3. Frontend (React)
# Desde el directorio frontend/
cd frontend
npm run dev
# Debe estar corriendo en http://localhost:3000
```

---

## 📦 Instalación Paso a Paso

### Paso 1: Clonar o Actualizar Repositorio

```powershell
# Si es la primera vez
git clone <repository-url>
cd idurar-erp-crm

# Si ya tienes el repositorio
git pull origin main
```

### Paso 2: Instalar Dependencias de e2e-tests

```powershell
# Navegar al directorio de pruebas
cd e2e-tests

# Instalar dependencias
npm install

# Instalar navegadores de Playwright (solo primera vez)
npx playwright install chromium

# Opcional: Instalar todos los navegadores
npx playwright install
```

**Salida esperada:**
```
added 245 packages in 15s
Downloading browsers...
✔ chromium v1.40.0 downloaded
```

### Paso 3: Instalar Dependencias para Generador de Datos

```powershell
# Navegar al directorio CP056
cd ..\non-functional-tests\CP056-table-rendering

# Instalar axios para el generador de datos
npm init -y
npm install axios
```

### Paso 4: Configurar Autenticación de Playwright

```powershell
# Volver al directorio e2e-tests
cd ..\..\e2e-tests

# Ejecutar setup de autenticación
npx playwright test --project=setup

# Verificar que se creó el archivo de autenticación
# Debe existir: e2e-tests/test-data/auth.json
```

**Nota**: Si el archivo `auth.json` no existe, Playwright no podrá autenticarse y las pruebas fallarán.

---

## ⚙️ Configuración del Entorno

### Variables de Entorno

Crear archivo `.env` en el directorio raíz del proyecto:

```powershell
# Crear archivo .env
@"
# Backend API
BASE_URL=http://localhost:3000
DATABASE=mongodb://localhost:27017/idurar

# Credenciales de administrador
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
"@ | Out-File -FilePath .env -Encoding UTF8
```

### Verificar Configuración de Playwright

Editar `e2e-tests/playwright.config.ts` si es necesario:

```typescript
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // ...
  },
});
```

### Configurar Backend URL para Generador de Datos

Editar `generate-test-data.js` (líneas 12-13):

```javascript
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';
const API_URL = `${BASE_URL}/api`;
```

**Importante**: El generador de datos se conecta al **backend** (puerto 8888), no al frontend.

---

## 🏭 Generación de Datos de Prueba

### ¿Por Qué Generar Datos?

CP056 requiere **mínimo 1000 clientes** en la base de datos para evaluar correctamente el rendimiento de renderizado de tablas con grandes volúmenes de datos.

### Ejecutar Generador

```powershell
# Navegar al directorio CP056
cd non-functional-tests\CP056-table-rendering

# Generar 1500 clientes (recomendado)
node generate-test-data.js 1500
```

### Salida Esperada

```
=================================================================================
📊 GENERADOR DE DATOS DE PRUEBA - CP056
=================================================================================

📋 Configuración:
  • Backend URL: http://localhost:8888
  • Admin Email: admin@admin.com
  • Clientes a generar: 1500
  • Concurrencia: 10 requests paralelos

🔐 Autenticando...
✅ Autenticación exitosa

🏭 Generando 1500 clientes ficticios...
✅ 1500 clientes generados en memoria

📦 Divididos en 150 lotes de 10 clientes

📦 Procesando lote 1/150 (10 clientes)...
  ✅ Exitosos: 10

📦 Procesando lote 2/150 (10 clientes)...
  ✅ Exitosos: 10

...

📦 Procesando lote 150/150 (10 clientes)...
  ✅ Exitosos: 10

=================================================================================
📊 RESUMEN DE GENERACIÓN DE DATOS
=================================================================================

✅ Clientes creados exitosamente: 1500
⏱️  Tiempo total: 45.67s
📈 Velocidad: 32.86 clientes/segundo

=================================================================================

🎉 ¡Base de datos lista para ejecutar CP056!
   Ahora puedes ejecutar las pruebas de rendimiento de tabla.
```

### Parámetros del Generador

```powershell
# Sintaxis
node generate-test-data.js [cantidad]

# Ejemplos
node generate-test-data.js 1000   # Generar 1000 clientes
node generate-test-data.js 2000   # Generar 2000 clientes
node generate-test-data.js 500    # Generar 500 clientes (mínimo para testing)
```

**Límites**:
- Mínimo: 1 cliente
- Máximo: 10,000 clientes
- Recomendado: 1500 clientes

### Verificar Datos Creados

```powershell
# Conectarse a MongoDB
mongosh

# Usar base de datos
use idurar

# Contar clientes
db.clients.countDocuments({ removed: false })
# Salida esperada: 1500 (o la cantidad que generaste)

# Ver algunos clientes
db.clients.find({ removed: false }).limit(3).pretty()
```

---

## 🧪 Ejecución de Pruebas

### Opción 1: Ejecutar con npm Script (Recomendado)

```powershell
# Volver al directorio e2e-tests
cd ..\..\e2e-tests

# Ejecutar CP056
npm run perf:cp056
```

### Opción 2: Ejecutar Directamente con Playwright

```powershell
# Desde e2e-tests/

# Ejecutar en Chromium
npx playwright test ..\non-functional-tests\CP056-table-rendering\cp056-table-rendering.spec.ts --project=chromium

# Ejecutar en modo headful (ver navegador)
npx playwright test ..\non-functional-tests\CP056-table-rendering\cp056-table-rendering.spec.ts --project=chromium --headed

# Ejecutar con reporte detallado
npx playwright test ..\non-functional-tests\CP056-table-rendering\cp056-table-rendering.spec.ts --project=chromium --reporter=list
```

### Opción 3: Ejecutar Tests Específicos

```powershell
# Solo CP056-01 (Carga Inicial)
npx playwright test -g "CP056-01" --project=chromium

# Solo CP056-03 (Paginación)
npx playwright test -g "CP056-03" --project=chromium
```

### Ver Reportes

```powershell
# Generar reporte HTML
npx playwright show-report

# Esto abrirá el navegador con un reporte interactivo
```

---

## 🐛 Solución de Problemas

### Problema 1: Error de Autenticación

**Síntoma**:
```
Error: No account with this email has been registered
```

**Solución**:
```powershell
# 1. Verificar que el backend esté corriendo
curl http://localhost:8888/api/login

# 2. Re-ejecutar setup de Playwright
cd e2e-tests
npx playwright test --project=setup

# 3. Verificar credenciales en .env
cat .env | Select-String "ADMIN"

# 4. Verificar que existe el usuario admin en MongoDB
mongosh
use idurar
db.users.findOne({ email: "admin@admin.com" })
```

**Si no existe el usuario admin**, crearlo manualmente o ejecutar seeder del backend.

### Problema 2: Tabla Vacía (< 1000 registros)

**Síntoma**:
```
✅ CP056-01: Medir tiempo de carga inicial de tabla
  Error: expect(received).toBeGreaterThanOrEqual(expected)
  Expected: >= 1000
  Received: 0
```

**Solución**:
```powershell
# 1. Verificar número de clientes en BD
mongosh
use idurar
db.clients.countDocuments({ removed: false })

# 2. Si < 1000, ejecutar generador de datos
cd non-functional-tests\CP056-table-rendering
node generate-test-data.js 1500
```

### Problema 3: Timeout al Cargar Tabla

**Síntoma**:
```
Error: page.waitForSelector: Timeout 10000ms exceeded
```

**Soluciones**:

**A. Aumentar timeout en el script:**
```typescript
// Editar cp056-table-rendering.spec.ts
await page.waitForSelector('.ant-table-tbody', { 
  state: 'visible', 
  timeout: 30000 // Aumentar a 30s
});
```

**B. Verificar que el frontend/backend respondan:**
```powershell
# Verificar frontend
curl http://localhost:3000/customer

# Verificar backend
curl http://localhost:8888/api/client/list?page=1

# Verificar MongoDB
mongosh --eval "db.serverStatus().ok"
```

### Problema 4: Navegador No Instalado

**Síntoma**:
```
Error: browserType.launch: Executable doesn't exist
```

**Solución**:
```powershell
cd e2e-tests
npx playwright install chromium

# O instalar todos los navegadores
npx playwright install
```

### Problema 5: Error de Módulo `axios` en Generador

**Síntoma**:
```
Error: Cannot find module 'axios'
```

**Solución**:
```powershell
cd non-functional-tests\CP056-table-rendering
npm init -y
npm install axios
```

### Problema 6: Tiempos Exceden Umbrales

**Síntoma**:
```
❌ Carga inicial: 4567.89ms / 3000ms
```

**Soluciones**:

**A. Verificar recursos del sistema:**
```powershell
# Monitorear CPU/RAM
Get-Process | Where-Object {$_.Name -like "*node*" -or $_.Name -like "*mongo*"}
```

**B. Cerrar aplicaciones pesadas** (Chrome con muchas tabs, IDE, etc.)

**C. Verificar optimizaciones de backend:**
- Índices en MongoDB
- Query eficiente en `paginatedList`
- Sin `populate()` innecesarios

**D. Ajustar umbrales temporalmente** (solo para debugging):
```typescript
// En cp056-table-rendering.spec.ts
const PERFORMANCE_THRESHOLDS = {
  initialLoad: 5000,  // Aumentar temporalmente
  // ...
};
```

### Problema 7: Error "Base URL no definida"

**Síntoma**:
```
Error: baseURL is not set in playwright.config.ts
```

**Solución**:
```powershell
# Verificar que frontend esté corriendo
curl http://localhost:3000

# Verificar playwright.config.ts
cat e2e-tests\playwright.config.ts | Select-String "baseURL"

# Debe mostrar:
# baseURL: process.env.BASE_URL || 'http://localhost:3000',
```

---

## ❓ FAQ (Preguntas Frecuentes)

### 1. ¿Cuánto tiempo toma generar 1500 clientes?

**Respuesta**: Entre 30-60 segundos, dependiendo de la velocidad del backend y la latencia de MongoDB. El script crea 10 clientes en paralelo para optimizar el tiempo.

### 2. ¿Puedo ejecutar CP056 sin generar datos?

**Respuesta**: Sí, pero la prueba **fallará** si hay menos de 1000 registros en la tabla. CP056 está diseñado específicamente para evaluar rendimiento con grandes volúmenes de datos.

### 3. ¿Cómo limpio los datos de prueba después?

**Respuesta**: 
```powershell
# Opción 1: Eliminar todos los clientes generados por el script
mongosh
use idurar
db.clients.deleteMany({ notes: /Test client generated for CP056/ })

# Opción 2: Eliminar TODOS los clientes (⚠️ cuidado en producción)
db.clients.deleteMany({ removed: false })
```

### 4. ¿Puedo ejecutar CP056 en otros navegadores?

**Respuesta**: Sí:
```powershell
# Firefox
npx playwright test ..\non-functional-tests\CP056-table-rendering\cp056-table-rendering.spec.ts --project=firefox

# Safari (WebKit)
npx playwright test ..\non-functional-tests\CP056-table-rendering\cp056-table-rendering.spec.ts --project=webkit

# Todos los navegadores
npx playwright test ..\non-functional-tests\CP056-table-rendering\cp056-table-rendering.spec.ts
```

### 5. ¿Los umbrales son configurables?

**Respuesta**: Sí, editar `PERFORMANCE_THRESHOLDS` en `cp056-table-rendering.spec.ts`:

```typescript
const PERFORMANCE_THRESHOLDS = {
  initialLoad: 3000,    // Ajustar según tu ambiente
  tableRender: 3000,
  pageChange: 1000,
  search: 2000,
  refresh: 2000,
};
```

### 6. ¿Qué hago si el test falla en CI/CD?

**Respuesta**:
- Aumentar `retries` en `playwright.config.ts`
- Verificar que el servidor CI tenga recursos suficientes
- Ajustar umbrales para ambiente CI (generalmente más lentos)
- Ejecutar en `workers: 1` para evitar competencia por recursos

### 7. ¿Cómo interpreto las métricas?

**Respuesta**: Ver [README-CP056.md](./README-CP056.md) sección "Análisis de Resultados" para interpretación detallada.

### 8. ¿CP056 afecta los datos de producción?

**Respuesta**: **NO**, siempre y cuando:
- Ejecutes contra ambiente de desarrollo/testing
- No apuntes `BASE_URL` a producción
- Verifiques que `DATABASE` apunte a BD de testing

---

## 📞 Soporte

Si encuentras problemas no listados aquí:

1. **Revisar logs**:
   ```powershell
   # Ver logs del backend
   cd backend
   npm run dev
   # Observar errores en consola
   ```

2. **Ejecutar con debug**:
   ```powershell
   # Modo debug de Playwright
   $env:DEBUG="pw:api"
   npx playwright test ...
   ```

3. **Abrir issue** en el repositorio con:
   - Versión de Node.js / npm / Playwright
   - Sistema operativo
   - Logs completos del error
   - Pasos para reproducir

---

**Última actualización**: 2025-01-XX  
**Mantenido por**: QA Team - IDURAR ERP/CRM
