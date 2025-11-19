# Test Case CP033 - Crear impuesto válido

## Descripción
Suite de pruebas E2E para validar la creación exitosa de impuestos en el módulo de Taxes.

## Objetivo
Verificar que el sistema permite crear impuestos correctamente con todos sus campos y que se reflejan adecuadamente en la tabla de impuestos.

## Archivos Creados

### Page Object Model
- **`pages/TaxesPage.ts`**: Page Object para interactuar con el módulo de Taxes
  - Métodos principales:
    - `goto()`: Navega a la página de taxes
    - `clickAddNew()`: Abre el formulario de crear impuesto  
    - `fillTaxForm()`: Llena el formulario con datos del impuesto
    - `save()`: Guarda el impuesto y espera la respuesta del API
    - `createTax()`: Método helper que ejecuta todos los pasos
    - `findTaxByName()`: Busca un impuesto en la tabla por nombre
    - `isSwitchEnabled()`: Verifica el estado de los switches (enabled/isDefault)

### Test Suite
- **`tests/taxes/create-valid-tax.spec.ts`**: Suite completa con 6 casos de prueba

## Casos de Prueba Implementados

### CP033-001: Crear impuesto con todos los campos correctos ✅
**Datos:**
```javascript
{
  taxName: 'IVA General',
  taxValue: 16,
  enabled: true,
  isDefault: false
}
```

**Validaciones:**
- ✅ Impuesto aparece en la tabla
- ✅ Nombre coincide
- ✅ Valor muestra "16%"
- ✅ Switch "enabled" está activado
- ✅ Switch "isDefault" está desactivado

### CP033-002: Persistencia después de refrescar
Valida que el impuesto creado permanece después de refrescar la tabla.

### CP033-003: Crear impuesto con enabled=false
Verifica que se puede crear un impuesto deshabilitado.

### CP033-004: Crear impuesto con isDefault=true
Valida que se puede marcar un impuesto como predeterminado.

### CP033-005: Mostrar en primera posición
Verifica que los impuestos recién creados aparecen en la primera posición de la tabla.

### CP033-006: Crear múltiples impuestos
Valida que se pueden crear varios impuestos sin conflictos.

## Estructura del Módulo Taxes

### Campos del Formulario
- **Tax Name** (`taxName`): String, requerido
- **Tax Value** (`taxValue`): Number 0-100%, requerido
- **Enabled** (`enabled`): Boolean switch, default: true
- **Is Default** (`isDefault`): Boolean switch, default: false

### Componentes UI
- Formulario en drawer/panel lateral
- Botón "Add New Tax" (NO tiene ícono de plus, es texto)
- Botón de guardado: "Submit" (NO "Save")
- Switches de Ant Design para enabled/isDefault

## Lecciones Aprendidas

### Selectores Correctos
1. **Botón Add New Tax**: 
   ```typescript
   page.getByRole('button', { name: /add new tax/i })
   ```
   ❌ NO usar selectores de ícono `anticon-plus`

2. **Botón Submit**:
   ```typescript
   page.getByRole('button', { name: /submit/i }).last()
   ```
   ❌ NO buscar "Save"

3. **Inputs duplicados**: Existen 2 formularios (create y update), usar `.last()` para obtener el visible:
   ```typescript
   page.locator('input[id="taxName"]').last()
   ```

4. **Switches**: Navegar desde el input al botón:
   ```typescript
   page.locator('input[id="enabled"]').last().locator('..').locator('..').locator('button[role="switch"]')
   ```

### Problemas de Timing
- `waitForLoadState('networkidle')` puede causar timeouts en ejecución paralela
- Usar `.waitForTimeout(500)` después de abrir formularios
- Esperar respuesta del API antes de validar: `page.waitForResponse()`

### Race Conditions
- Los tests en paralelo crean impuestos que se mezclan entre sí
- Ejecutar con `--workers=1` para pruebas secuenciales
- Considerar usar nombres únicos con timestamps para evitar conflictos

## Comandos para Ejecutar

```bash
# Ejecutar todos los tests de Taxes
npm run test:taxes

# Ejecutar solo CP033
npm run test:cp033

# Ejecutar con un solo worker (secuencial)
npm run test:cp033 -- --workers=1

# Ejecutar solo en Chromium
npm run test:cp033 -- --project=chromium

# Modo headed (ver el navegador)
npm run test:cp033 -- --headed

# Ejecutar un test específico por línea
npx playwright test tests/taxes/create-valid-tax.spec.ts:20
```

## Configuración Actualizada

### `package.json`
```json
{
  "scripts": {
    "test:taxes": "playwright test tests/taxes",
    "test:cp033": "playwright test tests/taxes/create-valid-tax.spec.ts"
  }
}
```

### `fixtures/base.ts`
Se agregó `TaxesPage` al fixture personalizado:
```typescript
type CustomFixtures = {
  loginPage: LoginPage;
  customerPage: CustomerPage;
  dashboardPage: DashboardPage;
  taxesPage: TaxesPage; // ← Nuevo
};
```

## Estado Actual

### ✅ Funcional
- Page Object Model completo
- Test principal (CP033-001) ejecutándose correctamente
- Creación de impuestos exitosa
- Validaciones funcionando

### ⚠️ Problemas Conocidos
1. **Ejecución paralela**: Los tests en paralelo causan race conditions
   - **Solución**: Usar `--workers=1` o nombres únicos con timestamps

2. **networkidle timeout**: En algunos navegadores/sistemas, esperar networkidle puede tardar más de 30s
   - **Posible solución**: Cambiar a `waitForLoadState('load')` o aumentar timeout

3. **Tests de posición**: El orden de impuestos en la tabla no siempre es predecible
   - **Solución**: Modificar test para buscar el impuesto en toda la tabla en vez de asumir posición

## Próximos Pasos

1. ✅ Implementar validación de campos requeridos (CP034)
2. ✅ Implementar validación de rangos (CP035)
3. ✅ Implementar tests de edición (CP036)
4. ✅ Implementar tests de eliminación (CP037)
5. ✅ Implementar tests de búsqueda (CP038)

## Notas Técnicas

- Los switches de Ant Design usan `button[role="switch"]` con `aria-checked="true|false"`
- El FormElement está dentro de un `CreateForm` component
- Hay 2 instancias del formulario en el DOM (create y update), siempre usar `.last()`
- La API endpoint es `/api/taxes/create`
- El drawer se cierra automáticamente después de guardar exitosamente
