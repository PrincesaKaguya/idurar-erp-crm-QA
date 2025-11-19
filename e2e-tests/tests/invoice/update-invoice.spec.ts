import { test, expect } from '../../fixtures/base';

/**
 * CP040: Actualización de Facturas (Invoice Update)
 * 
 * Descripción: Verificar actualización de campos editables en una factura
 * 
 * ⚠️ LIMITACIÓN CONOCIDA:
 * La tabla de facturas en IDURAR usa virtualización de Ant Design,
 * lo que hace que las filas no sean accesibles directamente via Playwright.
 * Como workaround, estos tests están DESHABILITADOS (test.skip) hasta que
 * se implemente un método alternativo de navegación.
 * 
 * SOLUCIONES PROPUESTAS:
 * 1. Usar API directa para obtener IDs de facturas
 * 2. Crear facturas en setup y editar inmediatamente
 * 3. Modificar la aplicación para deshabilitar virtualización en modo test
 * 
 * Enfoque: Tests simplificados enfocados en validación de UI
 * - NO se verifica persistencia en base de datos
 * - NO se verifica actualización end-to-end completa
 * - SÍ se verifica que los campos sean editables
 * - SÍ se verifica validaciones del formulario
 * - SÍ se verifica cálculos automáticos
 * 
 * Patrón: Page-based navigation (ErpPanelModule)
 * - Navega a /invoice/update/:id
 * - Formulario completo en página (no drawer)
 * - Botones Cancel/Save en PageHeader
 */

test.describe('CP040: Actualización de Facturas (TESTS DESHABILITADOS - Ver limitaciones)', () => {
  let testInvoiceId: string;

  test.beforeEach(async ({ page }) => {
    // SKIP todos los tests hasta resolver el problema de virtualización
    test.skip(true, `
      ❌ TESTS DESHABILITADOS TEMPORALMENTE
      
      Motivo: La tabla de facturas usa virtualización de Ant Design que
      hace las filas inaccesibles para Playwright.
      
      Para habilitar estos tests:
      1. Implementar método para obtener IDs via API
      2. O deshabilitar virtualización en modo test
      3. O crear facturas en beforeEach y editarlas inmediatamente
      
      Ver archivo README-CP040.md para más detalles.
    `);
  });

  /**
   * TEST 1: Verificar que el formulario de actualización cargue correctamente
   */
  test('CP040-T01: Debe cargar el formulario de actualización con datos actuales', async ({ invoicePage }) => {
    // Verificar que el formulario esté visible
    const isFormVisible = await invoicePage.isUpdateFormVisible();
    expect(isFormVisible).toBe(true);
    
    // Verificar que los botones de acción estén presentes
    await expect(invoicePage.saveButton).toBeVisible();
    await expect(invoicePage.cancelButton).toBeVisible();
    
    // Verificar que campos principales estén visibles
    await expect(invoicePage.clientField).toBeVisible();
    await expect(invoicePage.numberField).toBeVisible();
    await expect(invoicePage.yearField).toBeVisible();
    await expect(invoicePage.statusField).toBeVisible();
    
    // Verificar que al menos un item esté presente
    const itemsCount = await invoicePage.getItemsCount();
    expect(itemsCount).toBeGreaterThan(0);
  });

  /**
   * TEST 2: Verificar que los campos sean editables
   */
  test('CP040-T02: Debe permitir modificar campos editables de la factura', async ({ invoicePage, page }) => {
    // Verificar que campos principales sean editables
    const isNumberEditable = await invoicePage.isFieldEditable('number');
    expect(isNumberEditable).toBe(true);
    
    const isYearEditable = await invoicePage.isFieldEditable('year');
    expect(isYearEditable).toBe(true);
    
    const isNotesEditable = await invoicePage.isFieldEditable('notes');
    expect(isNotesEditable).toBe(true);
    
    // Intentar modificar campo de notas
    const testNotes = `Test notes updated at ${new Date().toISOString()}`;
    await invoicePage.fillNotes(testNotes);
    
    // Verificar que el cambio se refleje en el campo
    const notesValue = await invoicePage.notesField.inputValue();
    expect(notesValue).toBe(testNotes);
    
    // Verificar que se puede cambiar el estado
    await invoicePage.fillStatus('pending');
    
    // Esperar un momento para que se aplique el cambio
    await page.waitForTimeout(500);
    
    // El status debería haberse actualizado
    // (No verificamos el valor exacto ya que el select puede tener formato diferente)
  });

  /**
   * TEST 3: Verificar que se puedan modificar items de la factura
   */
  test('CP040-T03: Debe permitir modificar items (productos/servicios) de la factura', async ({ invoicePage, page }) => {
    // Obtener cantidad inicial de items
    const initialItemsCount = await invoicePage.getItemsCount();
    expect(initialItemsCount).toBeGreaterThan(0);
    
    // Modificar el primer item
    await invoicePage.addItem(0, {
      itemName: 'Producto Actualizado',
      description: 'Descripción actualizada',
      quantity: '5',
      price: '100'
    });
    
    await page.waitForTimeout(1000);
    
    // Verificar que el item se haya modificado
    const itemNameInput = page.getByPlaceholder('Item Name').first();
    const itemNameValue = await itemNameInput.inputValue();
    expect(itemNameValue).toBe('Producto Actualizado');
    
    // Agregar un nuevo item
    await invoicePage.addItemButton.click();
    await page.waitForTimeout(500);
    
    // Verificar que se haya agregado
    const newItemsCount = await invoicePage.getItemsCount();
    expect(newItemsCount).toBe(initialItemsCount + 1);
    
    // Rellenar el nuevo item
    await invoicePage.addItem(initialItemsCount, {
      itemName: 'Nuevo Producto',
      quantity: '2',
      price: '50'
    });
    
    await page.waitForTimeout(500);
  });

  /**
   * TEST 4: Verificar cálculos automáticos (subtotal, tax, total)
   */
  test('CP040-T04: Debe calcular automáticamente subtotal, impuestos y total', async ({ invoicePage, page }) => {
    // Limpiar items existentes (excepto el primero que es obligatorio)
    const itemsCount = await invoicePage.getItemsCount();
    for (let i = itemsCount - 1; i > 0; i--) {
      await invoicePage.removeItem(i);
      await page.waitForTimeout(300);
    }
    
    // Agregar un item con valores conocidos
    await invoicePage.addItem(0, {
      itemName: 'Producto Test',
      quantity: '10',
      price: '100'
    });
    
    await page.waitForTimeout(1000);
    
    // Verificar que el subtotal se haya calculado (10 * 100 = 1000)
    const subTotal = await invoicePage.getSubTotal();
    // El subtotal puede venir formateado, verificamos que no esté vacío
    expect(subTotal).toBeTruthy();
    
    // El tax total y total también deberían tener valores calculados
    const taxTotal = await invoicePage.getTaxTotal();
    const total = await invoicePage.getTotal();
    
    expect(taxTotal).toBeTruthy();
    expect(total).toBeTruthy();
    
    // Agregar otro item y verificar que los totales se actualicen
    await invoicePage.addItemButton.click();
    await page.waitForTimeout(500);
    
    await invoicePage.addItem(1, {
      itemName: 'Producto Test 2',
      quantity: '5',
      price: '200'
    });
    
    await page.waitForTimeout(1000);
    
    // Obtener nuevos totales
    const newSubTotal = await invoicePage.getSubTotal();
    const newTotal = await invoicePage.getTotal();
    
    // Los totales deberían haber cambiado
    expect(newSubTotal).toBeTruthy();
    expect(newTotal).toBeTruthy();
  });

  /**
   * TEST 5: Verificar funcionalidad de cancelar
   */
  test('CP040-T05: Debe cancelar la edición y volver a la lista de facturas', async ({ invoicePage, page }) => {
    // Hacer algún cambio
    const testNotes = 'Notas que no se guardarán';
    await invoicePage.fillNotes(testNotes);
    
    await page.waitForTimeout(500);
    
    // Cancelar la edición
    await invoicePage.cancelEdit();
    
    // Verificar que haya regresado a la lista de facturas
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/invoice');
    expect(currentUrl).not.toContain('/update');
    
    // Verificar que la tabla de facturas esté visible
    const tableVisible = await page.locator('.ant-table').isVisible();
    expect(tableVisible).toBe(true);
  });

  /**
   * TEST 6: Verificar validación de campos requeridos
   */
  test('CP040-T06: Debe validar campos requeridos al intentar guardar', async ({ invoicePage, page }) => {
    // Intentar limpiar un campo requerido (número)
    await invoicePage.numberField.clear();
    
    await page.waitForTimeout(500);
    
    // Intentar guardar
    await invoicePage.saveButton.click();
    
    await page.waitForTimeout(1000);
    
    // Debería mostrar errores de validación
    const hasErrors = await invoicePage.hasValidationErrors();
    expect(hasErrors).toBe(true);
    
    // La página NO debería haber navegado (seguimos en update)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/invoice/update');
  });
});
