import { test, expect } from '../../fixtures/base';

/**
 * Test de debugging para CP038 - Investigar funcionalidad de eliminación
 */

test.describe('CP038 - Debug Delete Customer', () => {
  
  test('Investigar qué pasa al hacer click en delete', async ({ customerPage, page }) => {
    await customerPage.goto();
    
    const rowCount = await customerPage.getTableRowCount();
    console.log(`Total clientes: ${rowCount}`);
    
    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Capturar todas las requests HTTP
    page.on('request', request => {
      if (request.url().includes('customer')) {
        console.log(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('customer')) {
        console.log(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Obtener ID del cliente
    const customerId = await customerPage.getCustomerId(0);
    const customerData = await customerPage.getRowData(0);
    console.log(`Cliente seleccionado: ${JSON.stringify(customerData)}`);
    console.log(`Customer ID: ${customerId}`);

    // Abrir el menú de acciones
    await customerPage.openActionsMenu(0);
    await page.waitForTimeout(1000);

    // Ver qué opciones hay en el menú
    const menuItems = await page.locator('.ant-dropdown-menu-item, [role="menuitem"]').allTextContents();
    console.log(`Opciones del menú: ${JSON.stringify(menuItems)}`);

    // Buscar opción de delete
    const deleteOption = page.getByRole('menuitem', { name: /delete/i });
    const deleteExists = await deleteOption.count();
    console.log(`Opción Delete existe: ${deleteExists > 0}`);

    if (deleteExists > 0) {
      const deleteText = await deleteOption.textContent();
      console.log(`Texto de la opción: ${deleteText}`);
      
      // Click en delete
      await deleteOption.click();
      await page.waitForTimeout(1000);

      // Ver si aparece modal
      const modal = page.locator('.ant-modal');
      const modalVisible = await modal.isVisible();
      console.log(`Modal visible: ${modalVisible}`);

      if (modalVisible) {
        const modalText = await modal.textContent();
        console.log(`Contenido del modal: ${modalText}`);

        // Ver botones del modal
        const buttons = await modal.locator('button').allTextContents();
        console.log(`Botones del modal: ${JSON.stringify(buttons)}`);

        // Click en OK
        const okButton = page.getByRole('button', { name: /ok/i });
        console.log('Haciendo click en OK...');
        await okButton.click();

        // Esperar la request
        console.log('Esperando request de delete...');
        await page.waitForTimeout(5000);
      }
    }

    // Esperar un momento para ver las requests
    await page.waitForTimeout(2000);
  });
});
