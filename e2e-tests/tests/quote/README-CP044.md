# CP044: Crear Presupuesto

## 📋 Descripción
Verificar que el sistema permite crear un presupuesto (quote) con datos válidos.

## 🎯 Objetivo
Validar que un usuario puede crear un presupuesto ingresando los datos mínimos requeridos: cliente, items y tasa de impuesto.

## 📍 Ubicación del Módulo
- **Frontend**: `frontend/src/modules/QuoteModule/CreateQuoteModule/index.jsx`
- **Formulario**: `frontend/src/modules/QuoteModule/Forms/QuoteForm.jsx`
- **Page Object**: `pages/QuotePage.ts`
- **API Backend**: `/api/quote/create`

## ✅ Precondiciones
1. Usuario autenticado en el sistema
2. Al menos un cliente existente en el sistema
3. Al menos un impuesto configurado

## 🧪 Caso de Prueba

### Test 1: Crear presupuesto con datos mínimos
**Descripción**: Crea un presupuesto válido con los datos mínimos requeridos

**Pasos**:
1. Navegar a `/quote/create`
2. Seleccionar un cliente del dropdown
3. Llenar item:
   - Item Name: "Servicio Consultoría"
   - Description: "Consultoría técnica"
   - Quantity: 10
   - Price: 100
4. Seleccionar tasa de impuesto
5. Click en botón "Save"
6. Verificar redirección a `/quote`

**Resultado Esperado**: ✅ El presupuesto se crea exitosamente y redirige a la lista de quotes

---

## 📊 Resultados de Ejecución

### Última Ejecución: 19/11/2025
- **Browser**: Chromium
- **Duración**: 16.4s
- **Tests Ejecutados**: 2 (1 setup + 1 test)
- **Pasados**: ✅ 2/2 (100%)
- **Fallidos**: ❌ 0

### Detalles:
```
✓ [setup] authenticate (3.5s)
✓ Test 1: should create a quote with valid data (8.6s)
```

---

## 🚀 Ejecución

### Comando Principal
```bash
npm run test:cp044
```

### Comandos Alternativos
```bash
# Ejecutar con UI interactiva
npm run test:ui -- tests/quote/create-quote.spec.ts

# Ejecutar en modo debug
npm run test:debug -- tests/quote/create-quote.spec.ts
```

---

## 📁 Archivos Relacionados

### Tests
- **Spec File**: `tests/quote/create-quote.spec.ts`
- **Page Object**: `pages/QuotePage.ts`
- **Fixtures**: `fixtures/base.ts`

---

## 🔍 Campos del Formulario

### Campos Obligatorios
1. **Client** (`client`): Cliente al que se emite el presupuesto
   - Tipo: AutoComplete select
   - Validación: Requerido

2. **Items** (lista de items):
   - **Item Name** (`itemName`): Nombre del servicio/producto
     * Tipo: Input
     * Validación: Requerido, no solo espacios
   - **Description** (`description`): Descripción del item
     * Tipo: Input
     * Validación: Opcional
   - **Quantity** (`quantity`): Cantidad
     * Tipo: InputNumber
     * Validación: Requerido, mínimo 0
   - **Price** (`price`): Precio unitario
     * Tipo: InputNumber (moneda)
     * Validación: Requerido, mínimo 0
   - **Total**: Calculado automáticamente (quantity × price)

3. **Tax Rate** (`taxRate`): Tasa de impuesto
   - Tipo: SelectAsync
   - Validación: Requerido

### Campos Opcionales Pre-completados
- **Number** (`number`): Número de presupuesto (auto-incrementa desde `last_quote_number`)
- **Year** (`year`): Año actual
- **Status** (`status`): Estado inicial = "draft"
- **Date** (`date`): Fecha actual
- **Expire Date** (`expiredDate`): Fecha actual + 30 días
- **Notes** (`notes`): Notas adicionales

---

## 📝 Notas Técnicas

### Selectores CSS
```css
.ant-select-selector           /* Dropdowns de cliente y tax */
input[placeholder*="Item Name"] /* Campo de item */
input[placeholder*="description"] /* Campo de descripción */
.ant-input-number-input         /* Inputs numéricos (quantity, price) */
form button[type="submit"]      /* Botón Save del formulario */
```

### Estados de Quote
- `draft`: Borrador (estado inicial)
- `pending`: Pendiente
- `sent`: Enviado
- `accepted`: Aceptado
- `declined`: Rechazado

### Cálculos Automáticos
```javascript
// Cálculos realizados por el sistema:
item.total = quantity × price
subTotal = Σ(item.total)
taxTotal = subTotal × (taxRate / 100)
total = subTotal + taxTotal
```

---

## 🔧 Configuración de Settings
El sistema usa `last_quote_number` de Finance Settings para auto-incrementar el número de presupuesto.

---

## 👥 Autor
QA Team - IDURAR ERP/CRM

## 📅 Última Actualización
19 de Noviembre, 2025
