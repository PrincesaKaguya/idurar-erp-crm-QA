import { test, expect } from '../../fixtures/base';

/**
 * Test Suite: CP036 - Eliminar impuesto
 * 
 * Objetivo: Verificar que se puede eliminar un impuesto existente correctamente
 * y que desaparece de la lista después de la eliminación
 * 
 * Precondiciones:
 * - Usuario autenticado (vía auth.setup.ts)
 * - Aplicación corriendo en localhost:3000
 * - Backend API disponible en localhost:8888
 * - Debe existir al menos un impuesto en la base de datos para eliminar
 */

test.describe('CP036 - Eliminar impuesto', () => {
  test.beforeEach(async ({ taxesPage }) => {
    // Navegar a la página de Taxes antes de cada test
    await taxesPage.goto();
    
    // Asegurar que hay al menos un impuesto para trabajar
    const initialCount = await taxesPage.getTableRowCount();
    if (initialCount === 0) {
      // Crear un impuesto de prueba si no hay ninguno
      await taxesPage.createTax({
        taxName: 'Tax for Testing Delete',
        taxValue: 15,
        enabled: true
      });
    }
  });

  test('Debe mostrar modal de confirmación al intentar eliminar un impuesto', async ({ taxesPage }) => {
    // Paso 1: Verificar que hay impuestos en la tabla
    const rowCount = await taxesPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Paso 2: Abrir menú de acciones del primer impuesto
    const taxName = await taxesPage.getCellValue(0, 'name');
    
    // Paso 3: Hacer click en Delete
    await taxesPage.clickDelete(0);

    // Validación 1: ✅ Aparece modal de confirmación
    const modal = taxesPage.page.locator('.ant-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Validación 2: ✅ El modal contiene texto de confirmación
    const modalContent = taxesPage.page.locator('.ant-modal-confirm-content, .ant-modal-body');
    await expect(modalContent).toContainText(/delete|remove|eliminar/i);

    // Nota: El modal en este sistema no muestra el nombre específico del impuesto
    // solo muestra "Are You Sure You Want To Delete"
    
    // Limpiar - Cancelar el modal
    const cancelButton = taxesPage.page.getByRole('button', { name: /cancel|no/i });
    await cancelButton.click();
  });

  test('Debe poder cancelar la eliminación de un impuesto', async ({ taxesPage }) => {
    // Obtener cantidad inicial de impuestos
    const initialCount = await taxesPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener nombre del impuesto a "eliminar"
    const taxName = await taxesPage.getCellValue(0, 'name');

    // Abrir modal de eliminación
    await taxesPage.clickDelete(0);

    // Verificar que el modal está visible
    const modal = taxesPage.page.locator('.ant-modal');
    await expect(modal).toBeVisible();

    // Cancelar la eliminación
    const cancelButton = taxesPage.page.getByRole('button', { name: /cancel|no/i });
    await cancelButton.click();

    // Validación 1: ✅ El modal desaparece
    await expect(modal).not.toBeVisible();

    // Validación 2: ✅ La cantidad de impuestos no cambió
    const finalCount = await taxesPage.getTableRowCount();
    expect(finalCount).toBe(initialCount);

    // Validación 3: ✅ El impuesto específico sigue en la tabla
    const taxStillExists = await taxesPage.findTaxByName(taxName);
    expect(taxStillExists).toBeGreaterThanOrEqual(0);
  });

  test.skip('BLOQUEADO: Debe eliminar un impuesto exitosamente - Funcionalidad no implementada', async ({ taxesPage, page }) => {
    // Verificar que hay impuestos para eliminar
    const initialCount = await taxesPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener datos del último impuesto (para evitar eliminar impuestos importantes)
    const lastRowIndex = initialCount - 1;
    const taxName = await taxesPage.getCellValue(lastRowIndex, 'name');
    const taxValue = await taxesPage.getCellValue(lastRowIndex, 'value');

    console.log(`CP036 - Eliminando impuesto: ${taxName} (${taxValue})`);

    // Abrir modal de eliminación
    await taxesPage.clickDelete(lastRowIndex);

    // Esperar a que aparezca el modal
    await taxesPage.page.waitForTimeout(1000);

    // Confirmar la eliminación
    await taxesPage.confirmDelete();

    // Esperar a que la tabla se actualice
    await taxesPage.page.waitForTimeout(2000);

    // Validación: ✅ La cantidad de impuestos disminuyó en 1
    const finalCount = await taxesPage.getTableRowCount();
    expect(finalCount).toBe(initialCount - 1);
    console.log(`CP036 - Impuesto eliminado. Antes: ${initialCount}, Después: ${finalCount}`);

    // Validación 2: ✅ El impuesto ya no está en la tabla
    const taxIndex = await taxesPage.findTaxByName(taxName);
    expect(taxIndex).toBe(-1); // -1 significa que no se encontró
  });

  test.skip('BLOQUEADO: Debe eliminar y verificar que no aparece en búsqueda - Funcionalidad no implementada', async ({ taxesPage, page }) => {
    const initialCount = await taxesPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener nombre del último impuesto
    const lastRowIndex = initialCount - 1;
    const taxName = await taxesPage.getCellValue(lastRowIndex, 'name');

    console.log(`CP036 - Eliminando y verificando búsqueda para: ${taxName}`);

    // Eliminar el impuesto
    await taxesPage.clickDelete(lastRowIndex);
    await taxesPage.page.waitForTimeout(1000);
    await taxesPage.confirmDelete();

    // Esperar a que la tabla se actualice
    await taxesPage.page.waitForTimeout(2000);

    // Buscar el impuesto eliminado
    await taxesPage.searchInput.fill(taxName);
    await taxesPage.page.waitForTimeout(1500); // Esperar a que el filtro se aplique

    // Validación 1: ✅ No hay resultados en la búsqueda
    const resultsCount = await taxesPage.getTableRowCount();
    expect(resultsCount).toBe(0);

    // Validación 2: ✅ Aparece mensaje "No data" o tabla vacía
    const noDataMessage = taxesPage.page.locator('.ant-empty-description').first();
    await expect(noDataMessage).toBeVisible();
    
    console.log(`CP036 - Impuesto no encontrado en búsqueda después de eliminación`);

    // Limpiar búsqueda
    await taxesPage.searchInput.clear();
    await taxesPage.page.waitForTimeout(500);
  });

  test.skip('BLOQUEADO: Debe eliminar múltiples impuestos consecutivamente - Funcionalidad no implementada', async ({ taxesPage }) => {
    const initialCount = await taxesPage.getTableRowCount();
    
    // Necesitamos al menos 2 impuestos, si no los hay, crear algunos
    if (initialCount < 2) {
      await taxesPage.createTax({ taxName: 'Tax Delete Test 1', taxValue: 10, enabled: true });
      await taxesPage.createTax({ taxName: 'Tax Delete Test 2', taxValue: 15, enabled: true });
    }

    const updatedCount = await taxesPage.getTableRowCount();
    
    // Vamos a eliminar máximo 2 impuestos
    const deleteCount = Math.min(2, updatedCount);
    console.log(`CP036 - Eliminando ${deleteCount} impuestos consecutivamente`);

    for (let i = 0; i < deleteCount; i++) {
      const currentCount = await taxesPage.getTableRowCount();
      
      // Siempre eliminar el último impuesto
      const lastIndex = currentCount - 1;
      const taxName = await taxesPage.getCellValue(lastIndex, 'name');
      
      console.log(`CP036 - Eliminando impuesto ${i + 1}/${deleteCount}: ${taxName}`);
      
      await taxesPage.clickDelete(lastIndex);
      await taxesPage.page.waitForTimeout(1000);
      await taxesPage.confirmDelete();
      await taxesPage.page.waitForTimeout(2000);
      
      // Verificar que se eliminó
      const newCount = await taxesPage.getTableRowCount();
      expect(newCount).toBe(currentCount - 1);
    }

    // Validación final: ✅ Se eliminaron todos los impuestos esperados
    const finalCount = await taxesPage.getTableRowCount();
    expect(finalCount).toBe(updatedCount - deleteCount);
    console.log(`CP036 - ${deleteCount} impuestos eliminados. Inicial: ${updatedCount}, Final: ${finalCount}`);
  });

  test.skip('BLOQUEADO: Debe persistir la eliminación después de refrescar la página - Funcionalidad no implementada', async ({ taxesPage, page }) => {
    const initialCount = await taxesPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener nombre del último impuesto
    const lastRowIndex = initialCount - 1;
    const taxName = await taxesPage.getCellValue(lastRowIndex, 'name');

    console.log(`CP036 - Verificando persistencia de eliminación: ${taxName}`);

    // Eliminar el impuesto
    await taxesPage.clickDelete(lastRowIndex);
    await taxesPage.page.waitForTimeout(1000);
    await taxesPage.confirmDelete();
    await taxesPage.page.waitForTimeout(2000);

    // Anotar la cantidad después de eliminar
    const countAfterDelete = await taxesPage.getTableRowCount();
    expect(countAfterDelete).toBe(initialCount - 1);

    // Refrescar la página completamente
    await page.reload();
    await taxesPage.waitForTableToLoad();

    // Validación 1: ✅ La cantidad sigue siendo la misma después del reload
    const countAfterReload = await taxesPage.getTableRowCount();
    expect(countAfterReload).toBe(countAfterDelete);

    // Validación 2: ✅ El impuesto eliminado no reaparece
    const taxIndex = await taxesPage.findTaxByName(taxName);
    expect(taxIndex).toBe(-1);

    console.log(`CP036 - Eliminación persistió después de reload. Cantidad: ${countAfterReload}`);
  });

  test.skip('BLOQUEADO: Debe eliminar correctamente un impuesto con nombre que contiene caracteres especiales - Funcionalidad no implementada', async ({ taxesPage }) => {
    // Primero crear un impuesto con caracteres especiales
    const specialName = 'IVA 21% (España) - Año 2024';
    const taxValue = 21;

    await taxesPage.createTax({
      taxName: specialName,
      taxValue: taxValue,
      enabled: true
    });

    // Verificar que se creó
    const taxIndex = await taxesPage.findTaxByName(specialName);
    expect(taxIndex).toBeGreaterThanOrEqual(0);

    // Obtener la cantidad actual
    const initialCount = await taxesPage.getTableRowCount();

    // Eliminar el impuesto con caracteres especiales
    const rowIndex = await taxesPage.findTaxByName(specialName);
    await taxesPage.clickDelete(rowIndex);
    await taxesPage.page.waitForTimeout(1000);
    await taxesPage.confirmDelete();
    await taxesPage.page.waitForTimeout(2000);

    // Validación 1: ✅ La cantidad disminuyó
    const finalCount = await taxesPage.getTableRowCount();
    expect(finalCount).toBe(initialCount - 1);

    // Validación 2: ✅ El impuesto ya no existe
    const deletedTaxIndex = await taxesPage.findTaxByName(specialName);
    expect(deletedTaxIndex).toBe(-1);
  });
});
