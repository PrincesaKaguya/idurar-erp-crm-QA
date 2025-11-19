# CP042: Visualización de Tarjetas de Resumen del Dashboard

## 📋 Descripción
Validar que las 4 tarjetas de resumen del dashboard (Invoices, Quotes, Paid, Unpaid) se visualicen correctamente con datos válidos y formato de moneda apropiado.

## 🎯 Objetivo
Verificar que el módulo de resumen del dashboard muestre información precisa y consistente de facturas, cotizaciones y pagos.

## 📍 Ubicación del Módulo
- **Frontend**: `frontend/src/modules/DashboardModule/index.jsx`
- **Componentes**: `SummaryCard`, `PreviewCard`, `CustomerPreviewCard`
- **APIs Backend**: 
  - `/api/invoice/summary`
  - `/api/quote/summary`
  - `/api/payment/summary`

## ✅ Precondiciones
1. Usuario autenticado en el sistema
2. Sistema con datos de facturas, cotizaciones y pagos
3. Base de datos poblada con registros de prueba

## 🧪 Casos de Prueba

### Test 1: Visualización de las 4 Tarjetas
**Descripción**: Verifica que las 4 tarjetas de resumen sean visibles y contengan datos válidos

**Pasos**:
1. Navegar al dashboard (`/`)
2. Esperar a que las tarjetas carguen completamente
3. Validar visibilidad de cada tarjeta:
   - Invoices (This month)
   - Quotes (This month)
   - Paid (This month)
   - Unpaid (Not Paid)
4. Verificar que cada tarjeta contiene datos (no vacías)
5. Confirmar que no hay spinners de carga activos

**Resultado Esperado**: ✅ Las 4 tarjetas son visibles con datos válidos

---

### Test 2: Títulos y Prefijos Correctos
**Descripción**: Valida que cada tarjeta muestre el título y prefijo apropiados

**Pasos**:
1. Navegar al dashboard
2. Esperar carga de tarjetas
3. Obtener datos de las 4 tarjetas
4. Verificar títulos específicos:
   - Tarjeta 1: Contiene "invoice"
   - Tarjeta 2: Contiene "quote"
5. Verificar prefijos:
   - Invoices/Quotes: "This month" o "Este mes"
   - Unpaid: "Not Paid" o "No pagado"

**Resultado Esperado**: ✅ Títulos y prefijos coinciden con los valores esperados

---

### Test 3: Formato de Moneda Válido
**Descripción**: Valida que los montos se muestren en formato de moneda correcto

**Pasos**:
1. Navegar al dashboard
2. Esperar carga de tarjetas
3. Para cada tarjeta:
   - Obtener el monto mostrado
   - Validar formato de moneda (ej: `$1,234.56`)
   - Extraer valor numérico
   - Verificar que el valor sea ≥ 0
   - Confirmar que no sea NaN

**Resultado Esperado**: ✅ Todos los montos tienen formato de moneda válido y valores numéricos correctos

---

## 📊 Resultados de Ejecución

### Última Ejecución: 19/11/2025
- **Browser**: Chromium
- **Duración**: 28.8s
- **Tests Ejecutados**: 4 (1 setup + 3 tests)
- **Pasados**: ✅ 4/4 (100%)
- **Fallidos**: ❌ 0

### Detalles:
```
✓ [setup] authenticate (6.2s)
✓ Test 1: should display all 4 summary cards with valid data (16.7s)
✓ Test 2: should display correct titles and prefixes (17.3s)
✓ Test 3: should display amounts with valid currency format (17.5s)
```

---

## 🚀 Ejecución

### Comando Principal
```bash
npm run test:cp042
```

### Comandos Alternativos
```bash
# Ejecutar todos los tests del dashboard
npm run test:dashboard

# Ejecutar con UI interactiva
npm run test:ui -- tests/dashboard/summary-cards.spec.ts

# Ejecutar en modo debug
npm run test:debug -- tests/dashboard/summary-cards.spec.ts
```

---

## 📁 Archivos Relacionados

### Tests
- **Spec File**: `tests/dashboard/summary-cards.spec.ts`
- **Page Object**: `pages/DashboardPage.ts`
- **Fixtures**: `fixtures/base.ts`

### Page Object Methods
```typescript
// Navegación
goto(): Promise<void>

// Obtención de datos
getSummaryCardTitle(card): Promise<string>
getSummaryCardPrefix(card): Promise<string>
getSummaryCardAmount(card): Promise<string>
getAllSummaryCardsData(): Promise<CardData[]>

// Validaciones
isSummaryCardLoading(card): Promise<boolean>
waitForSummaryCardsToLoad(): Promise<void>
isValidCurrencyFormat(amount): boolean
extractNumericValue(currencyString): number
```

---

## 🔍 Datos Validados

### Tarjetas del Dashboard
1. **Invoices** (This month)
   - Total de facturas del mes actual
   - Formato: Moneda ($)

2. **Quotes** (This month)
   - Total de cotizaciones del mes actual
   - Formato: Moneda ($)

3. **Paid** (This month)
   - Total pagado en el mes actual
   - Formato: Moneda ($)

4. **Unpaid** (Not Paid)
   - Total de facturas no pagadas
   - Formato: Moneda ($)

### Formatos Esperados
- **Moneda**: `$1,234.56` (con símbolo, separador de miles y decimales)
- **Títulos**: Texto en inglés (invoice, quote, paid, unpaid)
- **Prefijos**: "This month" o "Not Paid" (inglés/español)

---

## 🐛 Problemas Conocidos

### ✅ Resueltos
1. **Timeout en Firefox/WebKit**: Solucionado ejecutando solo en Chromium
2. **Carga asíncrona lenta**: Ajustados timeouts a 15000ms

### ⚠️ Limitaciones
- Tests configurados solo para Chromium (mejor rendimiento)
- Requiere datos en el sistema para validación completa

---

## 📝 Notas Técnicas

### Selectores CSS
```css
.whiteBox.shadow               /* Contenedor de tarjetas */
.statistic-title               /* Título de tarjeta */
.statistic-prefix              /* Prefijo (ej: "This month") */
.ant-statistic-content-value   /* Valor monetario */
.ant-spin                      /* Spinner de carga */
```

### Estados de Factura
- `draft`: Borrador
- `pending`: Pendiente
- `overdue`: Vencida
- `paid`: Pagada (#95de64 - verde)
- `unpaid`: No pagada (#ffa940 - naranja)
- `partially`: Parcialmente pagada

---

## 👥 Autor
QA Team - IDURAR ERP/CRM

## 📅 Última Actualización
19 de Noviembre, 2025
