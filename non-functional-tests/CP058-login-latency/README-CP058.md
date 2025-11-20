# CP058 - Documentación Técnica Completa

## 📋 Información General

| Campo | Valor |
|-------|-------|
| **ID** | CP058 |
| **Nombre** | Evaluación de Latencia del Login |
| **Categoría** | No Funcional - Rendimiento |
| **Prioridad** | Alta |
| **Tipo de Prueba** | UI Performance Testing (Playwright) |
| **Duración Estimada** | ~2-3 minutos |
| **Autor** | QA Team |
| **Fecha Creación** | 2025-01-19 |

---

## 🎯 Objetivos y Alcance

### Objetivo Principal
Determinar el tiempo que tarda el sistema en autenticar al usuario y mostrar el panel principal (dashboard) completamente funcional, desde el momento que hace click en "Login" hasta que puede interactuar con la aplicación.

### Objetivos Específicos
1. ✅ Medir tiempo de respuesta del endpoint `/api/login`
2. ✅ Medir tiempo total de autenticación (frontend + backend)
3. ✅ Medir tiempo de carga del dashboard
4. ✅ Medir tiempo hasta primera interacción posible
5. ✅ Medir tiempo de logout
6. ✅ Evaluar consistencia entre múltiples logins
7. ✅ Validar que elementos del dashboard carguen correctamente

### Alcance

**Incluido:**
- ✅ Tiempo de respuesta de API de login
- ✅ Tiempo de autenticación completa
- ✅ Tiempo de renderizado del dashboard
- ✅ Tiempo hasta primera interacción (TTI)
- ✅ Tiempo de logout
- ✅ Consistencia en múltiples logins
- ✅ Validación de elementos UI cargados

**No Incluido:**
- ❌ Tiempo de carga de página de login inicial
- ❌ Pruebas con credenciales incorrectas
- ❌ Pruebas de recuperación de contraseña
- ❌ Pruebas de registro de usuario
- ❌ Pruebas de autenticación OAuth/SSO
- ❌ Pruebas con red lenta (throttling)

---

## 🔬 Especificación Técnica

### Arquitectura del Flujo de Login

```
┌─────────────┐
│   Browser   │
│  (Chromium) │
└──────┬──────┘
       │ 1. User clicks "Login"
       │
       ▼
┌─────────────────────────────────┐
│  Frontend (React)               │
│  - Form validation              │
│  - Redux dispatch login action  │
└──────┬──────────────────────────┘
       │ 2. POST /api/login
       │
       ▼
┌──────────────────────────────────┐
│  Backend API (Node.js/Express)   │
│  POST /api/login                 │
│  - Validate credentials          │
│  - Query MongoDB                 │
│  - Generate JWT token            │
└──────┬───────────────────────────┘
       │ 3. Response + token
       │
       ▼
┌──────────────────────────────┐
│   Frontend                   │
│   - Store token in Redux     │
│   - Navigate to /            │
│   - Render Dashboard         │
└──────┬───────────────────────┘
       │ 4. Dashboard loads
       │
       ▼
┌──────────────────────────────┐
│  Dashboard Components        │
│  - Layout rendering          │
│  - Sidebar loading           │
│  - Menu items                │
│  - API calls for data        │
└──────────────────────────────┘
```

### Componentes Involucrados

#### 1. Login Page
**Ubicación:** `frontend/src/pages/Login/`

```jsx
// Componente de Login
<Form onFinish={handleLogin}>
  <Input type="email" name="email" />
  <Input type="password" name="password" />
  <Button type="submit">Login</Button>
</Form>
```

**Características:**
- Ant Design Form component
- Redux para manejo de estado
- Validación client-side
- Redirección automática a `/` después de login exitoso

#### 2. Backend Login Endpoint
**Archivo:** `backend/src/controllers/authController.js`

```javascript
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Buscar usuario en MongoDB
  const user = await User.findOne({ email, removed: false });
  
  if (!user || !user.comparePassword(password)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Generar token JWT
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});
```

**Request:**
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@demo.com",
  "password": "admin123"
}
```

**Response (exitoso):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@demo.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### 3. Dashboard Component
**Ubicación:** `frontend/src/pages/Dashboard/`

Elementos clave que se cargan:
- **Layout principal** (`.ant-layout`)
- **Sidebar** (`.ant-layout-sider`)
- **Header** (`.ant-layout-header`)
- **Menú de navegación** (`.ant-menu`)
- **Widgets/Cards** (datos del dashboard)

---

## 📊 Métricas y Umbrales

### Umbrales de Rendimiento

| Métrica | Umbral (ms) | Justificación |
|---------|-------------|---------------|
| Respuesta API | 2000 | Backend debería responder rápido |
| Autenticación completa | 3000 | Incluye validación + token |
| Carga dashboard | 5000 | Renderizado React + componentes |
| Tiempo total login | 8000 | Experiencia de usuario aceptable |
| Primera interacción | 10000 | Usuario puede empezar a trabajar |
| Logout | 2000 | Cerrar sesión debe ser rápido |

### Distribución Típica de Tiempo

**Total: ~5000ms (5 segundos)**

**Fase 1: Autenticación (30-40%)**
- 🔵 **Request preparation**: 50-100ms
- 🔵 **Network latency**: 100-200ms
- 🔵 **Backend processing**: 300-600ms
  - MongoDB query: 100-300ms
  - Password hash check: 100-200ms
  - JWT generation: 50-100ms
- 🔵 **Response parsing**: 50-100ms
- **Subtotal**: ~600-1000ms

**Fase 2: Navegación (10-20%)**
- 🟢 **Route change**: 100-200ms
- 🟢 **URL update**: 50-100ms
- **Subtotal**: ~150-300ms

**Fase 3: Dashboard Render (40-50%)**
- 🟡 **Initial render**: 500-800ms
- 🟡 **Component mounting**: 400-600ms
- 🟡 **API calls for data**: 800-1200ms
- 🟡 **Final render**: 300-500ms
- **Subtotal**: ~2000-3100ms

### Factores que Afectan Rendimiento

**Backend:**
- ✅ Índice en MongoDB (email field)
- ✅ Algoritmo de hash de password (bcrypt rounds)
- ✅ Complejidad de JWT payload
- ⚠️ Carga del servidor (CPU, memoria)
- ⚠️ Latencia de base de datos

**Frontend:**
- ✅ Tamaño del bundle de JavaScript
- ✅ Cantidad de componentes en dashboard
- ✅ Número de API calls iniciales
- ✅ Complejidad de Redux state
- ⚠️ Navegador del cliente
- ⚠️ Hardware del cliente

**Network:**
- ⚠️ Latencia de red
- ⚠️ Ancho de banda
- ⚠️ Congestión

---

## 🧪 Casos de Prueba Detallados

### CP058-01: Tiempo de Autenticación

**Objetivo:** Medir tiempo de respuesta del backend al autenticar

**Precondiciones:**
- Usuario válido existe en base de datos
- Backend ejecutándose

**Pasos:**
1. Navegar a `/login`
2. Llenar email y password
3. Click en submit
4. Capturar tiempo de request y response de `/api/login`

**Implementación:**
```typescript
page.on('request', request => {
  if (request.url().includes('/api/login')) {
    apiStartTime = performance.now();
  }
});

page.on('response', response => {
  if (response.url().includes('/api/login')) {
    apiEndTime = performance.now();
  }
});

const apiTime = apiEndTime - apiStartTime;
```

**Resultado esperado:**
- ✅ API responde en < 2000ms
- ✅ Autenticación total < 3000ms
- ✅ Response status 200
- ✅ Token JWT presente en response

---

### CP058-02: Carga del Dashboard

**Objetivo:** Medir tiempo de renderizado completo del dashboard

**Pasos:**
1. Realizar login completo
2. Esperar redirección a `/`
3. Medir tiempo hasta `networkidle`
4. Verificar sidebar visible

**Implementación:**
```typescript
await page.waitForURL(DASHBOARD_URL);
const dashboardStartTime = performance.now();

await page.waitForLoadState('networkidle');
await page.locator('.ant-layout-sider').waitFor({ state: 'visible' });

const dashboardTime = performance.now() - dashboardStartTime;
```

**Resultado esperado:**
- ✅ Dashboard carga en < 5000ms
- ✅ Tiempo total (login + dashboard) < 8000ms
- ✅ URL es `/`
- ✅ Sidebar visible

---

### CP058-03: Primera Interacción

**Objetivo:** Medir tiempo hasta que usuario puede interactuar

**Método:**
Esperar a que elementos interactivos estén disponibles:
- Menu items (`.ant-menu-item`)
- Botones habilitados (`button:not([disabled])`)
- Links (`a[href]`)

**Implementación:**
```typescript
const interactiveElements = [
  '.ant-menu-item',
  'button:not([disabled])',
  'a[href]',
];

for (const selector of interactiveElements) {
  const element = page.locator(selector).first();
  if (await element.isVisible()) {
    await element.waitFor({ state: 'attached' });
    break;
  }
}
```

**Resultado esperado:**
- ✅ Primera interacción < 10000ms
- ✅ Menú visible y clickeable
- ✅ Botones no deshabilitados

---

### CP058-04: Tiempo de Logout

**Objetivo:** Medir velocidad de cerrar sesión

**Pasos:**
1. Realizar login
2. Buscar botón/link de logout
3. Click en logout
4. Medir tiempo hasta redirección a `/login`

**Implementación:**
```typescript
const logoutSelectors = [
  'text=/logout/i',
  '[class*="logout"]',
  'button:has-text("Logout")',
];

for (const selector of logoutSelectors) {
  const element = page.locator(selector).first();
  if (await element.isVisible()) {
    await element.click();
    break;
  }
}

await page.waitForURL(LOGIN_URL);
```

**Resultado esperado:**
- ✅ Logout completo en < 2000ms
- ✅ Redirección a `/login`
- ✅ Token eliminado de storage

---

### CP058-05: Consistencia de Login

**Objetivo:** Verificar que rendimiento es consistente

**Escenario:**
Ejecutar 3 logins consecutivos:

```typescript
for (let i = 0; i < 3; i++) {
  if (i > 0) await performLogout(page);
  
  const { totalTime } = await performLogin(page);
  loginTimes.push(totalTime);
}

const avgTime = loginTimes.reduce((a, b) => a + b) / 3;
const variance = Math.max(...loginTimes) - Math.min(...loginTimes);
```

**Métricas calculadas:**
- Promedio de tiempos
- Tiempo mínimo
- Tiempo máximo
- Variación (max - min)

**Validaciones:**
```typescript
expect(avgTime).toBeLessThan(8000);
expect(variance).toBeLessThan(5000); // Max 5s variation
```

**Análisis:**
- ⚠️ Si promedio > 10s: Problema general de performance
- ⚠️ Si variación > 8s: Inconsistencia (caché, GC, network)

---

### CP058-06: Validación de Elementos

**Objetivo:** Verificar que componentes del dashboard carguen

**Elementos a validar:**

| Elemento | Selector | Crítico |
|----------|----------|---------|
| Layout principal | `.ant-layout` | ✅ Sí |
| Sidebar | `.ant-layout-sider` | ✅ Sí |
| Menú navegación | `.ant-menu` | ⚠️ Recomendado |
| Header | `.ant-layout-header` | ⚠️ Recomendado |

**Implementación:**
```typescript
const elementsToCheck = [
  { selector: '.ant-layout', name: 'Layout principal' },
  { selector: '.ant-layout-sider', name: 'Sidebar' },
  { selector: '.ant-menu', name: 'Menú navegación' },
  { selector: '.ant-layout-header', name: 'Header' },
];

for (const element of elementsToCheck) {
  const el = page.locator(element.selector).first();
  const isVisible = await el.isVisible();
  console.log(`${isVisible ? '✅' : '⚠️'} ${element.name}`);
}
```

**Resultado esperado:**
- ✅ Layout principal visible (crítico)
- ✅ Al menos 2/4 elementos visibles

---

## 📈 Análisis de Resultados

### Ejemplo de Output Completo

```
🧪 CP058-01: Midiendo tiempo de autenticación...
  ✅ Respuesta API: 567.23ms
  ✅ Autenticación total: 1234.56ms

🧪 CP058-02: Midiendo carga del dashboard...
  ✅ Autenticación: 589.12ms
  ✅ Carga dashboard: 2456.78ms
  ✅ Tiempo total: 3045.90ms

🧪 CP058-03: Midiendo primera interacción...
  ✅ Tiempo hasta interacción: 1234.56ms
  ✅ Tiempo total: 4567.89ms

🧪 CP058-04: Midiendo tiempo de logout...
  ✅ Logout completado en: 456.78ms

🧪 CP058-05: Midiendo consistencia de login...
  1. Login 1: 3234.56ms
  2. Login 2: 2987.34ms
  3. Login 3: 3456.78ms

  📊 Estadísticas:
     • Promedio: 3226.23ms
     • Más rápido: 2987.34ms
     • Más lento: 3456.78ms
     • Variación: 469.44ms

🧪 CP058-06: Validando elementos del dashboard...
  ✅ Dashboard cargado en: 2678.90ms
  ✅ Layout principal: visible
  ✅ Sidebar: visible
  ✅ Menú navegación: visible
  ✅ Header: visible

===============================================================================
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP058
===============================================================================

⏱️  TIEMPOS DE LOGIN:
  • Autenticación API: 567.23ms (umbral: 2000ms)
  • Autenticación completa: 1234.56ms (umbral: 3000ms)
  • Carga dashboard: 2456.78ms (umbral: 5000ms)
  • Tiempo total login: 3045.90ms (umbral: 8000ms)
  • Primera interacción: 4567.89ms (umbral: 10000ms)
  • Tiempo logout: 456.78ms (umbral: 2000ms)

📊 ESTADÍSTICAS:
  • Repeticiones medidas: 6

✅ VALIDACIONES:
  ✅ Autenticación API: 567.23ms / 2000ms
  ✅ Autenticación completa: 1234.56ms / 3000ms
  ✅ Carga dashboard: 2456.78ms / 5000ms
  ✅ Tiempo total: 3045.90ms / 8000ms
  ✅ Primera interacción: 4567.89ms / 10000ms
  ✅ Logout: 456.78ms / 2000ms

===============================================================================
```

### Interpretación de Métricas

#### ✅ Rendimiento Óptimo
```
API: 567ms
Autenticación: 1234ms
Dashboard: 2456ms
Total: 3045ms
```

**Análisis:**
- Backend muy rápido (< 1s)
- Dashboard eficiente (< 3s)
- Experiencia de usuario excelente

#### ⚠️ Rendimiento Aceptable
```
API: 1456ms
Autenticación: 2678ms
Dashboard: 4234ms
Total: 6912ms
```

**Análisis:**
- Cerca de umbrales
- Experiencia aceptable pero mejorable
- Monitorear tendencias

#### ❌ Rendimiento Deficiente
```
API: 3456ms
Autenticación: 5234ms
Dashboard: 8567ms
Total: 13801ms
```

**Problemas identificados:**
- ❌ API > 3s (revisar queries MongoDB)
- ❌ Dashboard > 8s (optimizar React)
- ❌ Total > 13s (experiencia pobre)

---

## 🔧 Optimizaciones Recomendadas

### Backend

#### 1. Índices MongoDB
```javascript
// Crear índice en email
db.users.createIndex({ email: 1 }, { unique: true });

// Índice compuesto con removed
db.users.createIndex({ email: 1, removed: 1 });
```

#### 2. Bcrypt Rounds
```javascript
// Reducir rounds si es necesario (con cuidado)
const saltRounds = 10; // Default 12, reducir a 10 si performance crítica
bcrypt.hash(password, saltRounds);
```

#### 3. JWT Optimization
```javascript
// Payload mínimo
const token = jwt.sign(
  { id: user._id, role: user.role }, // Solo esencial
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### Frontend

#### 1. Code Splitting
```javascript
// Lazy load dashboard components
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

#### 2. Memoización
```javascript
const MemoizedSidebar = React.memo(Sidebar);
const MemoizedHeader = React.memo(Header);
```

#### 3. Reducir API Calls Iniciales
```javascript
// Cargar datos esenciales primero, lazy load el resto
useEffect(() => {
  // Solo datos críticos
  loadEssentialData();
  
  // Datos secundarios después
  setTimeout(() => loadSecondaryData(), 1000);
}, []);
```

---

## 🚨 Troubleshooting

### Problema 1: Tests Fallan por Timeout

**Síntoma:**
```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded
```

**Soluciones:**
1. Verificar backend ejecutándose:
```bash
curl http://localhost:8888/api/login
```

2. Verificar credenciales correctas

3. Aumentar timeout si necesario:
```typescript
test.setTimeout(90000); // 90 segundos
```

---

### Problema 2: Dashboard No Carga

**Síntoma:**
```
TimeoutError: locator.waitFor: Timeout exceeded
```

**Diagnóstico:**
1. Verificar redirección:
```typescript
console.log('Current URL:', page.url());
```

2. Verificar errores en consola:
```typescript
page.on('console', msg => console.log('Browser:', msg.text()));
page.on('pageerror', err => console.log('Error:', err.message));
```

**Soluciones:**
- Verificar token en localStorage
- Revisar rutas protegidas
- Comprobar CORS en backend

---

### Problema 3: Login Muy Lento (> 10s)

**Diagnóstico:**
```javascript
// Backend logging
console.time('mongoQuery');
const user = await User.findOne({ email });
console.timeEnd('mongoQuery');

console.time('bcrypt');
const isValid = await bcrypt.compare(password, user.password);
console.timeEnd('bcrypt');
```

**Soluciones:**
1. Crear índices faltantes
2. Reducir bcrypt rounds
3. Implementar caché (Redis)
4. Optimizar queries MongoDB

---

## 📁 Estructura de Archivos

```
idurar-erp-crm/
│
├── e2e-tests/
│   ├── tests/
│   │   └── performance/
│   │       ├── cp056-table-rendering.spec.ts
│   │       ├── cp057-search-response-time.spec.ts
│   │       └── cp058-login-latency.spec.ts  ← NUEVO
│   │
│   └── package.json (actualizado con script)
│
└── non-functional-tests/
    └── CP058-login-latency/  ← NUEVO
        ├── README.md
        └── README-CP058.md (este archivo)
```

---

## 🔗 Tests Relacionados

### Tests de Rendimiento
- **CP054**: Load Testing con k6
- **CP056**: Table Rendering
- **CP057**: Search Response Time
- **CP058**: Login Latency ← ESTE TEST

### Tests Funcionales
- Login funcional (si existe)
- Autenticación con OAuth (si aplica)

---

## 📝 Notas de Implementación

### Playwright Configuration
```typescript
// playwright.config.ts
timeout: 60000, // 60 segundos
expect: {
  timeout: 15000,
},
```

### Environment Variables
```bash
# .env
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=admin@demo.com
TEST_USER_PASSWORD=admin123
```

### Sesiones Limpias
Cada test usa un navegador nuevo para evitar interferencia de tokens/cookies:

```typescript
test.beforeEach(async () => {
  browser = await chromium.launch();
  context = await browser.newContext();
  page = await context.newPage();
});
```

---

## 🎯 Criterios de Aceptación Final

### Must Have (Obligatorio)
- ✅ 6/6 tests pasan
- ✅ Login total < 8 segundos
- ✅ API response < 2 segundos
- ✅ Sin errores en consola

### Should Have (Deseable)
- ✅ Dashboard < 5 segundos
- ✅ Primera interacción < 10 segundos
- ✅ Variación < 5 segundos

### Nice to Have (Opcional)
- ℹ️ API < 500ms (muy rápido)
- ℹ️ Dashboard < 3 segundos
- ℹ️ Variación < 2 segundos

---

## 📞 Soporte

**Documentación relacionada:**
- [Playwright Docs](https://playwright.dev)
- [JWT Best Practices](https://jwt.io)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)

**Issues conocidos:**
- Ninguno identificado hasta la fecha

**Autor:** QA Team  
**Última actualización:** 2025-01-19
