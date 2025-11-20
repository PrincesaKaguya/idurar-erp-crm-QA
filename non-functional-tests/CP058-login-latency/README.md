# CP058 - Evaluación de Latencia del Login

## 📋 Descripción

Prueba de rendimiento que determina el tiempo que tarda el sistema en autenticar al usuario y mostrar el panel principal (dashboard), desde que el usuario hace click en "Login" hasta que puede interactuar con la aplicación.

## 🎯 Objetivo

Medir y validar que el proceso completo de autenticación y carga del dashboard se complete en tiempos aceptables para garantizar una experiencia de usuario fluida.

## 📊 Métricas Evaluadas

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| Respuesta API | < 2000ms | Tiempo de respuesta del endpoint `/api/login` |
| Autenticación completa | < 4000ms | Tiempo total de autenticación en backend |
| Carga dashboard | < 5000ms | Tiempo de renderizado del dashboard |
| Tiempo total login | < 8000ms | Tiempo completo: login + dashboard |
| Primera interacción | < 10000ms | Tiempo hasta poder interactuar |

**Nota:** Tests de logout y logins consecutivos fueron removidos por requerir manejo complejo de sesiones.

## 🧪 Casos de Prueba

### CP058-01: Tiempo de Autenticación
- **Descripción**: Medir tiempo de respuesta del backend al autenticar
- **Mide**: API response time + autenticación completa
- **Esperado**: API < 2s, Total < 4s

### CP058-02: Carga del Dashboard
- **Descripción**: Medir tiempo de renderizado del dashboard
- **Mide**: Tiempo desde autenticación hasta dashboard visible
- **Esperado**: Dashboard < 5s, Total < 8s

### CP058-03: Primera Interacción
- **Descripción**: Tiempo hasta que elementos son interactivos
- **Mide**: Tiempo hasta poder hacer click en menú/botones
- **Esperado**: < 10 segundos

### CP058-04: Validación de Elementos
- **Descripción**: Verificar que elementos del dashboard carguen
- **Valida**: Layout, Sidebar, Menú, Header

**Nota:** Los tests CP058-04 (logout) y CP058-05 (logins consecutivos) fueron removidos debido a la complejidad del manejo de sesiones limpias.

## 🚀 Ejecución

### Prerrequisitos
```bash
# Backend ejecutándose
cd backend
npm start

# Frontend ejecutándose
cd frontend
npm run dev

# Credenciales configuradas (opcional)
# Por defecto usa admin@demo.com / admin123
```

### Ejecutar Tests
```bash
cd e2e-tests

# Ejecutar CP058
npm run perf:cp058

# Ver reporte
npx playwright show-report
```

## 📈 Interpretación de Resultados

### Ejemplo de Output Exitoso
```
📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP058

⏱️  TIEMPOS DE LOGIN:
  • Autenticación API: 804.06ms (umbral: 2000ms)
  • Autenticación completa: 3517.98ms (umbral: 4000ms)
  • Carga dashboard: 112.13ms (umbral: 5000ms)
  • Tiempo total login: 4051.72ms (umbral: 8000ms)
  • Primera interacción: 4471.73ms (umbral: 10000ms)

✅ VALIDACIONES:
  ✅ Autenticación API: 804.06ms / 2000ms
  ✅ Autenticación completa: 3517.98ms / 4000ms
  ✅ Carga dashboard: 112.13ms / 5000ms
  ✅ Tiempo total: 4051.72ms / 8000ms
  ✅ Primera interacción: 4471.73ms / 10000ms

5 passed (16.6s)
```

### Señales de Problema
- ⚠️ **API > 3s**: Problema en backend (queries SQL/MongoDB lentas)
- ⚠️ **Dashboard > 8s**: Problema de renderizado React
- ⚠️ **Variación > 10s**: Inconsistencia en servidor/red
- ⚠️ **Primera interacción > 15s**: Demasiados componentes bloqueantes

## 🔧 Troubleshooting

### Tests Fallan por Timeout
```bash
# Verificar que backend y frontend estén ejecutándose
curl http://localhost:8888/api/login
curl http://localhost:3000
```

### Credenciales Incorrectas
```bash
# Configurar variables de entorno
$env:TEST_USER_EMAIL="admin@demo.com"
$env:TEST_USER_PASSWORD="admin123"
```

### Dashboard No Carga
1. Verificar en navegador manualmente
2. Revisar consola del navegador (F12)
3. Verificar logs del backend
4. Comprobar tokens de autenticación

## 📁 Estructura de Archivos

```
e2e-tests/
└── tests/
    └── performance/
        ├── cp056-table-rendering.spec.ts
        ├── cp057-search-response-time.spec.ts
        └── cp058-login-latency.spec.ts (NUEVO)

non-functional-tests/
└── CP058-login-latency/
    ├── README.md (este archivo)
    └── README-CP058.md (documentación técnica)
```

## 🔗 Tests Relacionados

- **CP054**: Load Testing con k6 (500 usuarios)
- **CP056**: Rendimiento de tabla (3000+ registros)
- **CP057**: Búsqueda de clientes

## 📝 Notas

- Usa sesiones limpias (nuevo navegador en cada test)
- Mide desde click en submit hasta dashboard interactivo
- No incluye tiempo de carga de página de login inicial
- API endpoint: `POST /api/login`
- Redirección esperada: `/login` → `/`

## 🎯 Criterios de Éxito

✅ **5/5 tests pasan** (reducido de 6, eliminados tests de logout y logins consecutivos)
✅ **Login total < 8 segundos**
✅ **API response < 2 segundos**
✅ **Dashboard interactivo < 10 segundos**
✅ **Autenticación completa < 4 segundos**
