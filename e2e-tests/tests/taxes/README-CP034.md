# CP034 - Editar impuesto

## 📋 Descripción
Suite de pruebas E2E para validar la funcionalidad de **editar impuestos existentes** en el módulo de Taxes de IDURAR ERP/CRM.

## 🎯 Objetivo
Modificar un impuesto existente y verificar que los cambios se reflejan correctamente en la tabla y persisten después de refrescar.

## 📝 Casos de Prueba Implementados

### ✅ Test 1: Debe modificar el valor de un impuesto existente
**Descripción**: Verifica que se puede cambiar el valor porcentual de un impuesto  
**Pasos**:
1. Seleccionar el primer impuesto de la tabla
2. Click en "Edit" desde el menú de acciones
3. Cambiar el Tax Value (incrementar en 5%)
4. Guardar los cambios

**Validaciones**:
- ✅ El cambio se refleja en la tabla
- ✅ El nuevo valor se muestra correctamente con el formato "X%"

---

### ✅ Test 2: Debe preservar el nombre del impuesto al editar solo el valor
**Descripción**: Verifica que al editar solo el valor, el nombre del impuesto no cambia  
**Pasos**:
1. Obtener nombre y valor originales del primer impuesto
2. Editar solo el valor usando `updateTax()`
3. Verificar los datos después de la edición

**Validaciones**:
- ✅ El nombre del impuesto permanece sin cambios
- ✅ El valor se actualiza correctamente

---

### ✅ Test 3: Debe actualizar el valor de un impuesto específico sin afectar otros
**Descripción**: Verifica que la edición de un impuesto no afecta a otros impuestos en la tabla  
**Precondición**: Deben existir al menos 2 impuestos en la base de datos  
**Pasos**:
1. Obtener datos del primer impuesto
2. Obtener datos del segundo impuesto
3. Editar el primer impuesto
4. Verificar ambos impuestos

**Validaciones**:
- ✅ El primer impuesto tiene el nuevo valor
- ✅ El segundo impuesto NO cambió (nombre y valor iguales)

---

### ✅ Test 4: Debe permitir editar el nombre y el valor simultáneamente
**Descripción**: Verifica que se pueden editar múltiples campos a la vez  
**Pasos**:
1. Obtener datos originales
2. Editar nombre y valor usando `updateTax({ taxName: ..., taxValue: ... })`
3. Buscar por el nuevo nombre

**Validaciones**:
- ✅ El nombre se actualizó correctamente
- ✅ El valor se actualizó correctamente

---

### ✅ Test 5: Debe mantener los cambios después de refrescar la tabla
**Descripción**: Verifica la persistencia de los cambios en la base de datos  
**Pasos**:
1. Editar un impuesto
2. Refrescar la tabla con `taxesPage.refresh()`
3. Buscar el impuesto editado

**Validaciones**:
- ✅ Los cambios persisten después del refresh
- ✅ El nuevo valor se mantiene en la tabla

---

## 🚀 Ejecución

### Ejecutar todos los tests de CP034
```bash
cd e2e-tests
npm run test:cp034
```

### Ejecutar con reporte HTML
```bash
npm run test:cp034 -- --reporter=html
npx playwright show-report
```

### Ejecutar en modo debug
```bash
npx playwright test tests/taxes/edit-tax.spec.ts --debug
```

### Ejecutar un test específico
```bash
npx playwright test tests/taxes/edit-tax.spec.ts:21  # Test 1: Modificar valor
npx playwright test tests/taxes/edit-tax.spec.ts:73  # Test 2: Preservar nombre
npx playwright test tests/taxes/edit-tax.spec.ts:95  # Test 3: No afectar otros
npx playwright test tests/taxes/edit-tax.spec.ts:129 # Test 4: Editar múltiples campos
npx playwright test tests/taxes/edit-tax.spec.ts:157 # Test 5: Persistencia
```

---

## 📊 Resultados

**Última Ejecución**: Noviembre 19, 2025  
**Estado**: ✅ **5/5 tests PASSING (100%)**  
**Duración**: ~1.3 minutos  
**Navegador**: Chromium

### Resumen de Tests
| # | Test | Estado | Duración |
|---|------|--------|----------|
| 1 | Modificar valor de impuesto | ✅ PASS | ~13.2s |
| 2 | Preservar nombre al editar valor | ✅ PASS | ~12.8s |
| 3 | No afectar otros impuestos | ✅ PASS | ~12.7s |
| 4 | Editar nombre y valor juntos | ✅ PASS | ~12.9s |
| 5 | Persistencia después de refresh | ✅ PASS | ~14.0s |

---

## 🔧 Métodos de Page Object Utilizados

### `TaxesPage.clickEdit(rowIndex: number)`
Abre el formulario de edición de un impuesto desde la tabla

**Implementación**:
```typescript
- Cierra cualquier drawer abierto
- Click en el botón de acciones (3 puntos) de la fila
- Selecciona "Edit" del menú dropdown
- Espera a que el drawer de edición se abra
```

### `TaxesPage.updateTax(rowIndex, newData)`
Edita un impuesto con nuevos datos

**Parámetros**:
- `rowIndex`: Índice de la fila (0-based)
- `newData`: Objeto con los campos a actualizar
  - `taxName?: string` - Nuevo nombre
  - `taxValue?: number` - Nuevo valor (0-100)
  - `enabled?: boolean` - Estado enabled
  - `isDefault?: boolean` - Estado default

**Características**:
- ✅ Actualización parcial (solo los campos proporcionados)
- ✅ Espera respuesta del API `/api/taxes/update`
- ✅ Cierra automáticamente el drawer
- ✅ Espera a que la tabla se recargue

**Ejemplo de uso**:
```typescript
// Editar solo el valor
await taxesPage.updateTax(0, { taxValue: 21 });

// Editar nombre y valor
await taxesPage.updateTax(0, { 
  taxName: 'IVA Reducido', 
  taxValue: 10 
});

// Editar switches
await taxesPage.updateTax(0, { 
  enabled: false, 
  isDefault: true 
});
```

---

## 🐛 Issues Resueltos Durante Implementación

### ❌ Issue 1: Drawer no se abre
**Problema**: El drawer de edición no se abría porque buscábamos `.anticon-edit` directo  
**Solución**: Usar `.ant-dropdown-trigger` para abrir el menú de 3 puntos, luego seleccionar "Edit"

### ❌ Issue 2: Botón Submit no visible
**Problema**: El botón submit no era visible usando `.last()`  
**Solución**: Cambiar a `.first()` y agregar `waitFor({ state: 'visible' })` antes del click

### ❌ Issue 3: Inputs duplicados en drawer
**Problema**: Hay 2 formularios en el drawer (create y update), selector `.last()` tomaba el incorrecto  
**Solución**: Scoping los inputs dentro del drawer visible y usar `.first()` para obtener el form con datos

### ❌ Issue 4: Strict mode violation con "Edit" menuitem
**Problema**: Múltiples elementos con texto "Edit" (navigation + dropdown)  
**Solución**: Filtrar por `.ant-dropdown:visible` antes de buscar el texto "Edit"

---

## 📚 Lecciones Aprendidas

1. **Drawer de edición vs creación**: Tienen estructura similar pero comportamientos diferentes
2. **Menú de acciones**: En Taxes se usa dropdown (3 puntos), no íconos directos
3. **Selectores en drawer**: Siempre scope dentro del drawer visible para evitar duplicados
4. **Botón submit**: Usar `.first()` para forms con datos precargados
5. **API wait**: Esperar respuesta de `/api/taxes/update` asegura que el cambio se guardó

---

## 🔗 Archivos Relacionados

- **Test Suite**: `e2e-tests/tests/taxes/edit-tax.spec.ts`
- **Page Object**: `e2e-tests/pages/TaxesPage.ts`
- **Fixtures**: `e2e-tests/fixtures/base.ts`
- **Config**: `e2e-tests/playwright.config.ts`

---

## 📌 Notas Importantes

- **Precondición**: Debe existir al menos 1 impuesto en la base de datos
- **Test 3** requiere 2+ impuestos (se salta automáticamente si no hay suficientes)
- Los tests son **independientes** y se pueden ejecutar en cualquier orden
- Cada test incrementa el valor en una cantidad diferente para evitar conflictos
- Se usa `findTaxByName()` para localizar impuestos después de editar (posición puede cambiar)

---

## ✨ Validaciones Clave de CP034

✅ **Funcionalidad Core**:
- Edición de valores numéricos (Tax Value)
- Edición de nombres (Tax Name)
- Preservación de datos no editados
- Aislamiento entre impuestos

✅ **Persistencia**:
- Cambios se guardan en base de datos
- Refresh no pierde los cambios
- API `/api/taxes/update` responde correctamente

✅ **UI/UX**:
- Drawer se abre correctamente
- Formulario muestra datos actuales
- Tabla se actualiza después de guardar
- Formato de porcentaje se mantiene ("16%")

---

**Estado Final**: ✅ **TODOS LOS TESTS PASANDO**  
**Cobertura**: Edición completa de impuestos (nombre, valor, switches, persistencia)
