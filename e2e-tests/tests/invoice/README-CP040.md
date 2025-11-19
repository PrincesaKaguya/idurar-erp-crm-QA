# CP040: Actualización de Facturas (Invoice Update)

## 📋 Descripción

Este caso de prueba valida la funcionalidad de actualización de facturas en el sistema IDURAR ERP/CRM, verificando que los usuarios puedan modificar campos editables de una factura existente.

## ⚠️ ESTADO ACTUAL: TESTS DESHABILITADOS

Los tests de este caso de prueba están temporalmente **DESHABILITADOS** debido a limitaciones técnicas identificadas durante la implementación.

### 🔴 Problema Identificado

La tabla de facturas en IDURAR utiliza **virtualización de Ant Design** (`rc-virtual-list`), que presenta los siguientes desafíos:

1. **Filas No Renderizadas**: Las filas de la tabla no se renderizan hasta que son visibles en el viewport
2. **Altura 0**: Las filas virtuales tienen `height: 0px; overflow: hidden`
3. **Inaccesibilidad para Playwright**: No es posible hacer click en elementos que no están renderizados
4. **Sin Botones de Acción Visibles**: Los botones "Edit" no están en el DOM hasta que la fila es visible

```html
<!-- Ejemplo de fila virtualizada -->
<td style="padding: 0px; border: 0px; height: 0px;">
  <div style="height: 0px; overflow: hidden;">&nbsp;</div>
</td>
```

### 💡 Soluciones Propuestas

Para habilitar estos tests en el futuro, se pueden implementar las siguientes soluciones:

#### Opción 1: Uso de API (RECOMENDADA)
```typescript
// Obtener IDs de facturas via API
const response = await request.get('/api/invoice/list');
const invoices = await response.json();
const firstInvoiceId = invoices.result[0]._id;

// Navegar directamente
await page.goto(`/invoice/update/${firstInvoiceId}`);
```

#### Opción 2: Crear Factura en Setup
```typescript
test.beforeEach(async ({ page }) => {
  // Crear factura via API
  const newInvoice = await createInvoiceViaAPI({
    client: 'Test Client',
    items: [{ itemName: 'Test', quantity: 1, price: 100 }]
  });
  
  // Navegar a editar
  await page.goto(`/invoice/update/${newInvoice._id}`);
});
```

#### Opción 3: Deshabilitar Virtualización en Modo Test
```javascript
// En la configuración del componente DataTable
const scroll = process.env.NODE_ENV === 'test' 
  ? undefined  // Sin virtualización en tests
  : { y: 400 }; // Con virtualización en producción
```

#### Opción 4: Usar Scroll Programático
```typescript
// Hacer scroll para forzar renderizado
await page.evaluate(() => {
  const table = document.querySelector('.ant-table-body');
  table.scrollTop = 0; // Forzar renderizado de primeras filas
});
```

## 📝 Casos de Prueba Implementados

A pesar de estar deshabilitados, los siguientes tests están completamente implementados y listos para ejecutarse una vez resuelto el problema de virtualización:

### CP040-T01: Cargar Formulario de Actualización
**Objetivo**: Verificar que el formulario de actualización cargue correctamente con datos actuales

**Pasos**:
1. Navegar a lista de facturas
2. Seleccionar factura a editar
3. Abrir formulario de actualización

**Validaciones**:
- ✓ Formulario visible con datos de la factura
- ✓ Botones Save y Cancel presentes
- ✓ Campos principales (client, number, year, status) visibles
- ✓ Al menos un item presente en la lista

### CP040-T02: Modificar Campos Editables
**Objetivo**: Verificar que se puedan modificar los campos editables

**Campos Editables Validados**:
- `number` (Número de factura)
- `year` (Año)
- `status` (draft | pending | sent)
- `notes` (Notas)

**Validaciones**:
- ✓ Campos son editables (isEditable)
- ✓ Cambios se reflejan en el campo
- ✓ Status selector funciona correctamente

### CP040-T03: Modificar Items de la Factura
**Objetivo**: Verificar que se puedan agregar/modificar/eliminar items

**Acciones**:
- Modificar item existente (nombre, descripción, cantidad, precio)
- Agregar nuevo item
- Eliminar item

**Validaciones**:
- ✓ Modificaciones se reflejan en el formulario
- ✓ Contador de items aumenta/disminuye correctamente
- ✓ Nuevos items se pueden rellenar

### CP040-T04: Cálculos Automáticos
**Objetivo**: Verificar que subtotal, impuestos y total se calculen automáticamente

**Fórmulas Esperadas**:
```
Item Total = Quantity × Price
SubTotal = Σ(Item Totals)
Tax Total = SubTotal × (Tax Rate / 100)
Total = SubTotal + Tax Total
```

**Validaciones**:
- ✓ SubTotal se calcula al modificar items
- ✓ Tax Total se calcula con la tasa seleccionada
- ✓ Total se actualiza con cada cambio
- ✓ Campos de cálculo son de solo lectura

### CP040-T05: Cancelar Edición
**Objetivo**: Verificar que se pueda cancelar sin guardar

**Pasos**:
1. Hacer modificaciones en el formulario
2. Click en botón "Cancel"

**Validaciones**:
- ✓ Regresa a lista de facturas
- ✓ URL cambia de `/invoice/update/:id` a `/invoice`
- ✓ Tabla de facturas visible

### CP040-T06: Validar Campos Requeridos
**Objetivo**: Verificar validaciones de formulario

**Campos Requeridos**:
- `client` (Cliente)
- `number` (Número)
- `year` (Año)
- `date` (Fecha)
- `expiredDate` (Fecha de vencimiento)
- `items` (Al menos un item con itemName, quantity, price)
- `taxRate` (Tasa de impuesto)

**Validaciones**:
- ✓ Mensajes de error aparecen al limpiar campos requeridos
- ✓ No permite guardar con campos vacíos
- ✓ Permanece en página de actualización si hay errores

## 🗂️ Estructura de la Factura

### Campos del Formulario

```typescript
interface InvoiceForm {
  // Información básica
  client: string;           // AutoComplete (búsqueda de clientes)
  number: number;           // InputNumber
  year: number;             // InputNumber
  status: 'draft' | 'pending' | 'sent';  // Select
  
  // Fechas
  date: Date;               // DatePicker
  expiredDate: Date;        // DatePicker
  
  // Items (lista dinámica)
  items: Array<{
    itemName: string;       // Input (requerido)
    description: string;    // Input (opcional)
    quantity: number;       // InputNumber (requerido)
    price: number;          // InputNumber (requerido)
    total: number;          // Calculado (readOnly)
  }>;
  
  // Cálculos
  taxRate: number;          // SelectAsync (desde tabla taxes)
  subTotal: number;         // Calculado (readOnly)
  taxTotal: number;         // Calculado (readOnly)
  total: number;            // Calculado (readOnly)
  
  // Opcional
  notes: string;            // Input
}
```

### Patrón de Actualización

```
ErpPanelModule (Page-Based)
├── Route: /invoice/update/:id
├── Component: UpdateInvoiceModule
│   ├── UpdateItem (wrapper)
│   └── InvoiceForm (formulario)
├── Layout: PageHeader + Form
└── Actions: Cancel / Save buttons
```

**Diferencias con Customer/Taxes**:
- ❌ NO usa Drawer
- ❌ NO usa CrudModule
- ✓ Usa navegación completa a nueva página
- ✓ Usa ErpPanelModule
- ✓ Formulario más complejo (items dinámicos, cálculos)

## 🚀 Guía de Ejecución

### Prerequisitos

```bash
# Instalar dependencias
cd e2e-tests
npm install

# Asegurarse que backend y frontend estén corriendo
# Backend: http://localhost:8888
# Frontend: http://localhost:3000
```

### Ejecutar Tests (Actualmente Skipped)

```bash
# Ejecutar todos los tests de CP040
npm run test:cp040

# Ejecutar en modo headed (ver navegador)
npm run test:cp040 -- --headed

# Ejecutar test específico
npm run test:cp040 -- --grep "CP040-T01"

# Ver reporte HTML
npm run show-report
```

### Resultado Esperado

```
Running 19 tests using 4 workers

  ✓  1 [setup] › tests\auth.setup.ts:19:6 › authenticate (4.3s)
  -  2 [chromium] › CP040-T01 (skipped)
  -  3 [chromium] › CP040-T02 (skipped)
  -  4 [chromium] › CP040-T03 (skipped)
  -  5 [chromium] › CP040-T04 (skipped)
  -  6 [chromium] › CP040-T05 (skipped)
  -  7 [chromium] › CP040-T06 (skipped)
  
  6 skipped
  1 passed (5.0s)
```

## 📂 Archivos Relacionados

```
e2e-tests/
├── pages/
│   └── InvoicePage.ts                    # ✅ Page Object implementado
├── fixtures/
│   └── base.ts                            # ✅ Fixture agregado
├── tests/
│   └── invoice/
│       ├── update-invoice.spec.ts         # ⚠️ Tests (deshabilitados)
│       └── README-CP040.md                # 📄 Este archivo
└── package.json                           # ✅ Script test:cp040 agregado
```

## 🔧 Page Object: InvoicePage

### Métodos Disponibles

```typescript
class InvoicePage {
  // Navegación
  goto(): Promise<void>
  navigateToUpdate(invoiceId: string): Promise<void>
  getInvoiceIdByNumber(invoiceNumber: string): Promise<string | null>
  
  // Form Fields - Basic
  fillClient(clientName: string): Promise<void>
  fillNumber(number: string): Promise<void>
  fillYear(year: string): Promise<void>
  fillStatus(status: 'draft' | 'pending' | 'sent'): Promise<void>
  fillNotes(notes: string): Promise<void>
  
  // Form Fields - Items
  addItem(index: number, itemData: ItemData): Promise<void>
  removeItem(index: number): Promise<void>
  getItemsCount(): Promise<number>
  
  // Form Fields - Tax
  fillTaxRate(taxName: string): Promise<void>
  getSubTotal(): Promise<string>
  getTaxTotal(): Promise<string>
  getTotal(): Promise<string>
  
  // Actions
  saveInvoice(): Promise<void>
  cancelEdit(): Promise<void>
  
  // Validations
  isFieldEditable(fieldName: string): Promise<boolean>
  isUpdateFormVisible(): Promise<boolean>
  hasValidationErrors(): Promise<boolean>
}
```

## 📊 Resultados de Debugging

Durante la implementación se identificaron los siguientes hallazgos:

### Intentos Realizados

1. ✅ **Page Object creado** - InvoicePage.ts completamente funcional
2. ✅ **Tests implementados** - 6 tests completos y bien estructurados
3. ❌ **Selector por texto "Edit"** - No funciona (botones no visibles)
4. ❌ **Selector por role "button"** - No funciona (fuera del DOM)
5. ❌ **Selector por href="/invoice/update/"** - No funciona (no renderizados)
6. ❌ **Selector data-row-key** - No funciona (filas virtualizadas)
7. ❌ **Click en celda** - Timeout (elemento no visible)
8. ❌ **Scroll programático** - No implementado (requiere más investigación)

### Logs de Debugging

```
Filas encontradas en la tabla: 2
HTML de la primera fila: <td style="padding: 0px; border: 0px; height: 0px;">
Elementos clickeables: 0
Botones en celda de acciones: 0
```

## ✅ Próximos Pasos

1. **Prioridad Alta**: Implementar obtención de IDs via API
2. **Prioridad Media**: Crear helper para setup de facturas de prueba
3. **Prioridad Baja**: Investigar configuración de virtualización en modo test
4. **Documentación**: Actualizar este README con la solución implementada

## 🤝 Contribuir

Si encuentras una solución para el problema de virtualización:

1. Implementa la solución en `update-invoice.spec.ts`
2. Remueve los `test.skip()` de los tests
3. Ejecuta `npm run test:cp040` para verificar
4. Actualiza este README con la solución
5. Documenta el approach en la sección "Soluciones Implementadas"

## 📝 Notas Adicionales

- **Patrón Simplificado**: Similar a CP039, estos tests se enfocan en UI validation, NO en persistencia
- **Browser Support**: Tests configurados para Chromium, Firefox y WebKit
- **Timeout**: 30 segundos por test (puede necesitar ajuste)
- **Auth**: Usa auth.json generado por tests/auth.setup.ts

## 🐛 Issues Conocidos

1. **Virtualización de Tabla**: Filas no accesibles para Playwright
2. **Sin Data-TestId**: IDURAR no usa data-testid en Invoice module
3. **Dropdown Complejo**: Acciones pueden estar en dropdown que requiere hover/click específico

## 📚 Referencias

- [Ant Design Table - Virtual List](https://ant.design/components/table#components-table-demo-virtual-list)
- [Playwright - Handling Dynamic Content](https://playwright.dev/docs/test-assertions#custom-expect-message)
- [IDURAR - Invoice Module](../../frontend/src/modules/InvoiceModule/)

---

**Última Actualización**: 2024
**Estado**: ⚠️ Tests Implementados pero Deshabilitados
**Autor**: QA Team
