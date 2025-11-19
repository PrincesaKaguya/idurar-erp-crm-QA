import { test, expect } from '../../fixtures/base';

/**
 * CP038 - Eliminar Customer
 * 
 * Test Suite: Validar funcionalidad de eliminación de clientes
 * 
 * Objetivos:
 * - Verificar que aparece opción "Delete" en el menú
 * - Validar que aparece modal de confirmación
 * - Verificar que se puede cancelar la eliminación
 * 
 * NOTA: La funcionalidad de eliminación NO está implementada en el frontend.
 * El botón "OK" no ejecuta ninguna llamada a la API.
 */

test.describe('CP038 - Eliminar Customer', () => {
  
  test.beforeEach(async ({ customerPage }) => {
    await customerPage.goto();
  });

  test('Debe mostrar modal de confirmación al intentar eliminar', async ({ customerPage }) => {
    // Arrange: Verificar que hay al menos un cliente
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Act: Abrir menú de acciones y hacer click en eliminar
    await customerPage.clickDelete(0);

    // Assert: Verificar que aparece modal de confirmación
    const modal = customerPage.page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // Verificar que el modal contiene texto de confirmación
    const modalContent = customerPage.page.locator('.ant-modal-confirm-content, .ant-modal-body');
    await expect(modalContent).toContainText(/delete|remove|eliminar/i);
    
    // Cerrar modal para no afectar otros tests
    await customerPage.cancelDelete();
  });

  test('Debe poder cancelar la eliminación', async ({ customerPage }) => {
    // Arrange: Obtener cantidad inicial de clientes
    const initialCount = await customerPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener datos del primer cliente
    const customerData = await customerPage.getRowData(0);
    const customerName = customerData['Name'] || customerData['Nombre'];

    // Act: Intentar eliminar pero cancelar
    await customerPage.clickDelete(0);
    
    const modal = customerPage.page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    await customerPage.cancelDelete();

    // Assert: Verificar que el modal desapareció
    await expect(modal).not.toBeVisible();

    // Verificar que el cliente sigue en la lista
    const finalCount = await customerPage.getTableRowCount();
    expect(finalCount).toBe(initialCount);

    // Verificar que el cliente específico sigue presente
    if (customerName) {
      const isStillPresent = await customerPage.isNameInTable(customerName);
      expect(isStillPresent).toBe(true);
    }
  });

  test.skip('BLOQUEADO: Debe eliminar un cliente exitosamente - Funcionalidad no implementada', async ({ customerPage, page }) => {
    // Arrange: Verificar que hay clientes para eliminar
    const initialCount = await customerPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener información del cliente a eliminar (último de la lista para mayor seguridad)
    const targetIndex = initialCount - 1;
    const customerId = await customerPage.getCustomerId(targetIndex);
    const customerData = await customerPage.getRowData(targetIndex);
    const customerName = customerData['Name'] || customerData['Nombre'];
    const customerEmail = customerData['Email'];

    console.log(`CP038 - Eliminando cliente: ${customerName} (${customerEmail}) - ID: ${customerId}`);

    // Setup: Interceptar llamada a la API de eliminación
    const deletePromise = page.waitForResponse(
      response => response.url().includes(`/api/customer/delete/${customerId}`) && response.status() === 200,
      { timeout: 10000 }
    );

    // Act: Eliminar el cliente
    await customerPage.clickDelete(targetIndex);
    
    // Confirmar eliminación en el modal
    await customerPage.confirmDelete();

    // Assert: Esperar respuesta de la API
    const deleteResponse = await deletePromise;
    expect(deleteResponse.status()).toBe(200);

    // Verificar que el contador de filas disminuyó
    const finalCount = await customerPage.getTableRowCount();
    expect(finalCount).toBe(initialCount - 1);

    // Verificar que el cliente ya no está en la tabla
    if (customerEmail) {
      const isStillPresent = await customerPage.isEmailInTable(customerEmail);
      expect(isStillPresent).toBe(false);
    }

    console.log(`CP038 - Cliente eliminado exitosamente. Antes: ${initialCount}, Después: ${finalCount}`);
  });

  test.skip('BLOQUEADO: Debe eliminar y verificar que no aparece en búsqueda - Funcionalidad no implementada', async ({ customerPage, page }) => {
    // Arrange: Verificar que hay clientes
    const initialCount = await customerPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener información del cliente a eliminar
    const customerId = await customerPage.getCustomerId(0);
    const customerData = await customerPage.getRowData(0);
    const customerEmail = customerData['Email'];
    
    if (!customerEmail) {
      test.skip();
      return;
    }

    console.log(`CP038 - Eliminando y verificando búsqueda para: ${customerEmail} - ID: ${customerId}`);

    // Setup: Interceptar API de eliminación
    const deletePromise = page.waitForResponse(
      response => response.url().includes(`/api/customer/delete/${customerId}`) && response.status() === 200,
      { timeout: 10000 }
    );

    // Act: Eliminar el cliente
    await customerPage.clickDelete(0);
    await customerPage.confirmDelete();

    // Assert: Verificar que se eliminó
    await deletePromise;

    // Buscar por email del cliente eliminado
    await customerPage.searchByEmail(customerEmail);

    // Verificar que no hay resultados
    const searchResults = await customerPage.getTableRowCount();
    expect(searchResults).toBe(0);

    // Verificar mensaje "No data"
    const noDataMessage = customerPage.page.locator('.ant-empty-description');
    await expect(noDataMessage).toBeVisible();

    console.log(`CP038 - Cliente no encontrado en búsqueda después de eliminación`);

    // Cleanup: Limpiar búsqueda
    await customerPage.clearSearch();
  });

  test.skip('BLOQUEADO: Debe eliminar múltiples clientes consecutivamente - Funcionalidad no implementada', async ({ customerPage, page }) => {
    // Arrange: Verificar que hay al menos 2 clientes
    const initialCount = await customerPage.getTableRowCount();
    
    if (initialCount < 2) {
      test.skip();
      return;
    }

    const deleteCount = Math.min(2, initialCount); // Eliminar máximo 2 clientes
    console.log(`CP038 - Eliminando ${deleteCount} clientes consecutivamente`);

    // Act & Assert: Eliminar clientes uno por uno
    for (let i = 0; i < deleteCount; i++) {
      const currentCount = await customerPage.getTableRowCount();
      
      // Siempre eliminar el último cliente de la lista
      const targetIndex = currentCount - 1;
      const customerId = await customerPage.getCustomerId(targetIndex);
      const customerData = await customerPage.getRowData(targetIndex);
      const customerName = customerData['Name'] || customerData['Nombre'];

      console.log(`CP038 - Eliminando cliente ${i + 1}/${deleteCount}: ${customerName} - ID: ${customerId}`);

      // Setup: Interceptar API
      const deletePromise = page.waitForResponse(
        response => response.url().includes(`/api/customer/delete/${customerId}`) && response.status() === 200,
        { timeout: 10000 }
      );

      // Eliminar
      await customerPage.clickDelete(targetIndex);
      await customerPage.confirmDelete();

      // Verificar que se eliminó
      await deletePromise;

      // Verificar que el contador disminuyó
      const newCount = await customerPage.getTableRowCount();
      expect(newCount).toBe(currentCount - 1);
    }

    // Assert final: Verificar cantidad total eliminada
    const finalCount = await customerPage.getTableRowCount();
    expect(finalCount).toBe(initialCount - deleteCount);

    console.log(`CP038 - ${deleteCount} clientes eliminados. Inicial: ${initialCount}, Final: ${finalCount}`);
  });

  test.skip('BLOQUEADO: Debe persistir la eliminación después de refrescar la página - Funcionalidad no implementada', async ({ customerPage, page }) => {
    // Arrange: Verificar que hay clientes
    const initialCount = await customerPage.getTableRowCount();
    expect(initialCount).toBeGreaterThan(0);

    // Obtener información del cliente a eliminar
    const targetIndex = initialCount - 1;
    const customerId = await customerPage.getCustomerId(targetIndex);
    const customerData = await customerPage.getRowData(targetIndex);
    const customerEmail = customerData['Email'];

    console.log(`CP038 - Verificando persistencia de eliminación: ${customerEmail} - ID: ${customerId}`);

    // Setup: Interceptar API
    const deletePromise = page.waitForResponse(
      response => response.url().includes(`/api/customer/delete/${customerId}`) && response.status() === 200,
      { timeout: 10000 }
    );

    // Act: Eliminar el cliente
    await customerPage.clickDelete(targetIndex);
    await customerPage.confirmDelete();

    // Verificar eliminación
    await deletePromise;
    const countAfterDelete = await customerPage.getTableRowCount();

    // Refrescar la página
    await page.reload();
    await customerPage.waitForTableToLoad();

    // Assert: Verificar que sigue eliminado después del reload
    const countAfterReload = await customerPage.getTableRowCount();
    expect(countAfterReload).toBe(countAfterDelete);

    // Verificar que el cliente no está presente
    if (customerEmail) {
      const isPresent = await customerPage.isEmailInTable(customerEmail);
      expect(isPresent).toBe(false);
    }

    console.log(`CP038 - Eliminación persistió después de reload. Cantidad: ${countAfterReload}`);
  });
});
