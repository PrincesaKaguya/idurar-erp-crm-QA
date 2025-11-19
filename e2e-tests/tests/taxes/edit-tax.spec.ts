import { test, expect } from '../../fixtures/base';

/**
 * Test Suite: CP034 - Editar impuesto
 * 
 * Objetivo: Verificar que se puede modificar un impuesto existente correctamente
 * 
 * Precondiciones:
 * - Usuario autenticado (vía auth.setup.ts)
 * - Aplicación corriendo en localhost:3000
 * - Backend API disponible en localhost:8888
 * - Debe existir al menos un impuesto en la base de datos para editar
 */

test.describe('CP034 - Editar impuesto', () => {
  test.beforeEach(async ({ taxesPage }) => {
    // Navegar a la página de Taxes antes de cada test
    await taxesPage.goto();
  });

  test('Debe modificar el valor de un impuesto existente', async ({ taxesPage }) => {
    // Paso 1: Verificar que hay impuestos en la tabla
    const rowCount = await taxesPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Seleccionar el primer impuesto
    const originalName = await taxesPage.getCellValue(0, 'name');
    const originalValue = await taxesPage.getCellValue(0, 'value');
    
    // Extraer el valor numérico (quitar el %)
    const originalNumericValue = parseInt(originalValue.replace('%', '').trim());

    // Paso 2-4: Editar el valor usando el método updateTax
    const newValue = originalNumericValue + 5;
    await taxesPage.updateTax(0, { taxValue: newValue });

    // Validación 1: ✅ Cambio se refleja en la tabla
    // Buscar el impuesto por nombre (ya que la posición puede cambiar)
    const taxRowIndex = await taxesPage.findTaxByName(originalName);
    expect(taxRowIndex).toBeGreaterThanOrEqual(0);

    // Validación 2: ✅ Muestra el nuevo valor insertado
    const updatedValue = await taxesPage.getCellValue(taxRowIndex, 'value');
    expect(updatedValue.trim()).toMatch(new RegExp(`${newValue}\\s*%`));
  });

  test('Debe preservar el nombre del impuesto al editar solo el valor', async ({ taxesPage }) => {
    const rowCount = await taxesPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Obtener datos originales
    const originalName = await taxesPage.getCellValue(0, 'name');
    const originalValue = await taxesPage.getCellValue(0, 'value');
    const originalNumericValue = parseInt(originalValue.replace('%', '').trim());

    // Editar solo el valor
    const newValue = originalNumericValue === 10 ? 15 : 10; // Cambiar a un valor diferente
    await taxesPage.updateTax(0, { taxValue: newValue });

    // Verificar que el nombre no cambió
    const taxRowIndex = await taxesPage.findTaxByName(originalName);
    expect(taxRowIndex).toBeGreaterThanOrEqual(0);

    // Verificar que el valor sí cambió
    const updatedValue = await taxesPage.getCellValue(taxRowIndex, 'value');
    expect(updatedValue.trim()).toMatch(new RegExp(`${newValue}\\s*%`));
  });

  test('Debe actualizar el valor de un impuesto específico sin afectar otros', async ({ taxesPage }) => {
    const rowCount = await taxesPage.getTableRowCount();
    
    // Necesitamos al menos 2 impuestos para este test
    if (rowCount < 2) {
      test.skip();
      return;
    }

    // Obtener datos del primer impuesto
    const firstTaxName = await taxesPage.getCellValue(0, 'name');
    const firstTaxValue = await taxesPage.getCellValue(0, 'value');

    // Obtener datos del segundo impuesto (para verificar que no cambia)
    const secondTaxName = await taxesPage.getCellValue(1, 'name');
    const secondTaxValue = await taxesPage.getCellValue(1, 'value');

    // Editar el primer impuesto
    const firstNumericValue = parseInt(firstTaxValue.replace('%', '').trim());
    const newValue = firstNumericValue + 7;
    
    await taxesPage.updateTax(0, { taxValue: newValue });

    // Verificar que el primer impuesto cambió
    const firstRowIndex = await taxesPage.findTaxByName(firstTaxName);
    const updatedFirstValue = await taxesPage.getCellValue(firstRowIndex, 'value');
    expect(updatedFirstValue.trim()).toMatch(new RegExp(`${newValue}\\s*%`));

    // Verificar que el segundo impuesto NO cambió
    const secondRowIndex = await taxesPage.findTaxByName(secondTaxName);
    const unchangedSecondValue = await taxesPage.getCellValue(secondRowIndex, 'value');
    expect(unchangedSecondValue.trim()).toBe(secondTaxValue.trim());
  });

  test('Debe permitir editar el nombre y el valor simultáneamente', async ({ taxesPage }) => {
    const rowCount = await taxesPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Obtener datos originales
    const originalName = await taxesPage.getCellValue(0, 'name');
    const originalValue = await taxesPage.getCellValue(0, 'value');
    const originalNumericValue = parseInt(originalValue.replace('%', '').trim());

    // Nuevos valores
    const newName = `${originalName} Editado`;
    const newValue = originalNumericValue + 3;

    // Editar nombre y valor
    await taxesPage.updateTax(0, { 
      taxName: newName, 
      taxValue: newValue 
    });

    // Buscar por el nuevo nombre
    const taxRowIndex = await taxesPage.findTaxByName(newName);
    expect(taxRowIndex).toBeGreaterThanOrEqual(0);

    // Verificar el nuevo valor
    const updatedValue = await taxesPage.getCellValue(taxRowIndex, 'value');
    expect(updatedValue.trim()).toMatch(new RegExp(`${newValue}\\s*%`));
  });

  test('Debe mantener los cambios después de refrescar la tabla', async ({ taxesPage }) => {
    const rowCount = await taxesPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Obtener datos originales
    const originalName = await taxesPage.getCellValue(0, 'name');
    const originalValue = await taxesPage.getCellValue(0, 'value');
    const originalNumericValue = parseInt(originalValue.replace('%', '').trim());

    // Editar el valor
    const newValue = originalNumericValue + 8;
    await taxesPage.updateTax(0, { taxValue: newValue });

    // Refrescar la tabla
    await taxesPage.refresh();

    // Verificar que el cambio persiste
    const taxRowIndex = await taxesPage.findTaxByName(originalName);
    expect(taxRowIndex).toBeGreaterThanOrEqual(0);

    const persistedValue = await taxesPage.getCellValue(taxRowIndex, 'value');
    expect(persistedValue.trim()).toMatch(new RegExp(`${newValue}\\s*%`));
  });
});
