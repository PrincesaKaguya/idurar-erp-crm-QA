import { Page, Locator } from '@playwright/test';

/**
 * Page Object para el módulo de Facturas (Invoice)
 * Utiliza ErpPanelModule - patrón de navegación a página completa
 * Ruta de actualización: /invoice/update/:id
 */
export class InvoicePage {
  readonly page: Page;
  
  // Locators principales
  readonly updatePageHeading: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  
  // Form fields - Basic info
  readonly clientField: Locator;
  readonly numberField: Locator;
  readonly yearField: Locator;
  readonly statusField: Locator;
  readonly dateField: Locator;
  readonly expiredDateField: Locator;
  readonly notesField: Locator;
  
  // Form fields - Items (dynamic list)
  readonly addItemButton: Locator;
  
  // Form fields - Calculations
  readonly taxRateField: Locator;
  readonly subTotalField: Locator;
  readonly taxTotalField: Locator;
  readonly totalField: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Page header and buttons
    this.updatePageHeading = page.getByRole('heading', { name: /invoice/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.saveButton = page.getByRole('button', { name: /save/i });
    
    // Form fields - usando getByLabel para campos principales
    this.clientField = page.getByLabel('Client', { exact: false });
    this.numberField = page.getByLabel('number', { exact: false });
    this.yearField = page.getByLabel('year', { exact: false });
    this.statusField = page.getByLabel('status', { exact: false });
    this.dateField = page.getByLabel('Date', { exact: false });
    this.expiredDateField = page.getByLabel('Expire Date', { exact: false });
    this.notesField = page.getByLabel('Note', { exact: false });
    
    // Dynamic items
    this.addItemButton = page.getByRole('button', { name: /add field/i });
    
    // Calculation fields
    this.taxRateField = page.getByLabel('Tax Rate', { exact: false });
    this.subTotalField = page.locator('input[id*="subTotal"]').first();
    this.taxTotalField = page.locator('input[id*="taxTotal"]').first();
    this.totalField = page.locator('input[id*="total"]').last();
  }

  /**
   * Navega a la página principal de facturas
   */
  async goto(): Promise<void> {
    await this.page.goto('/invoice');
    // Esperar a que la tabla sea visible en lugar de networkidle
    await this.page.locator('.ant-table').waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Navega directamente a la página de actualización de factura
   * @param invoiceId - ID de la factura a actualizar
   */
  async navigateToUpdate(invoiceId: string): Promise<void> {
    await this.page.goto(`/invoice/update/${invoiceId}`);
    await this.page.waitForLoadState('networkidle');
    // Esperar a que el formulario cargue
    await this.updatePageHeading.waitFor({ state: 'visible' });
  }

  /**
   * Obtiene una factura por su número desde la lista
   * @param invoiceNumber - Número de factura a buscar
   * @returns ID de la factura o null si no se encuentra
   */
  async getInvoiceIdByNumber(invoiceNumber: string): Promise<string | null> {
    await this.goto();
    
    // Buscar la fila con el número de factura
    const row = this.page.locator(`tr:has-text("${invoiceNumber}")`).first();
    
    if (await row.isVisible()) {
      // Click en el botón Edit de esa fila
      const editButton = row.locator('button[aria-label*="edit"]').first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        await this.page.waitForLoadState('networkidle');
        
        // Extraer ID de la URL actual
        const url = this.page.url();
        const match = url.match(/\/invoice\/update\/([a-f0-9]+)/);
        return match ? match[1] : null;
      }
    }
    
    return null;
  }

  /**
   * Completa el campo de cliente (AutoComplete)
   * @param clientName - Nombre del cliente
   */
  async fillClient(clientName: string): Promise<void> {
    await this.clientField.click();
    await this.clientField.fill(clientName);
    // Esperar a que aparezcan las opciones del autocomplete
    await this.page.waitForTimeout(500);
    // Seleccionar la primera opción
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  /**
   * Actualiza el campo de número de factura
   * @param number - Número de factura
   */
  async fillNumber(number: string): Promise<void> {
    await this.numberField.clear();
    await this.numberField.fill(number);
  }

  /**
   * Actualiza el campo de año
   * @param year - Año de la factura
   */
  async fillYear(year: string): Promise<void> {
    await this.yearField.clear();
    await this.yearField.fill(year);
  }

  /**
   * Actualiza el estado de la factura
   * @param status - Estado: 'draft', 'pending', 'sent'
   */
  async fillStatus(status: 'draft' | 'pending' | 'sent'): Promise<void> {
    await this.statusField.click();
    await this.page.getByText(status, { exact: true }).click();
  }

  /**
   * Actualiza el campo de notas
   * @param notes - Notas de la factura
   */
  async fillNotes(notes: string): Promise<void> {
    await this.notesField.clear();
    await this.notesField.fill(notes);
  }

  /**
   * Agrega un nuevo item a la factura
   * @param index - Índice del item (0-based)
   * @param itemData - Datos del item { itemName, description, quantity, price }
   */
  async addItem(index: number, itemData: { 
    itemName: string; 
    description?: string; 
    quantity: string; 
    price: string;
  }): Promise<void> {
    // Si es el primer item, ya existe uno agregado automáticamente
    if (index > 0) {
      await this.addItemButton.click();
      await this.page.waitForTimeout(300);
    }
    
    // Rellenar campos del item usando nth para seleccionar el item específico
    const itemNameInput = this.page.getByPlaceholder('Item Name').nth(index);
    await itemNameInput.fill(itemData.itemName);
    
    if (itemData.description) {
      const descriptionInput = this.page.getByPlaceholder('description Name').nth(index);
      await descriptionInput.fill(itemData.description);
    }
    
    // Quantity y Price son InputNumber - buscar por rol y posición
    const quantityInputs = this.page.getByRole('spinbutton').filter({ has: this.page.locator('[id*="quantity"]') });
    await quantityInputs.nth(index).fill(itemData.quantity);
    
    const priceInputs = this.page.getByRole('spinbutton').filter({ has: this.page.locator('[id*="price"]') });
    await priceInputs.nth(index).fill(itemData.price);
    
    // Esperar a que se calcule el total del item
    await this.page.waitForTimeout(300);
  }

  /**
   * Elimina un item de la lista
   * @param index - Índice del item a eliminar (0-based)
   */
  async removeItem(index: number): Promise<void> {
    const deleteButtons = this.page.locator('[aria-label="delete"]');
    await deleteButtons.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Selecciona la tasa de impuesto (Tax Rate)
   * @param taxName - Nombre del impuesto a seleccionar
   */
  async fillTaxRate(taxName: string): Promise<void> {
    await this.taxRateField.click();
    await this.page.waitForTimeout(500);
    await this.page.getByText(taxName).first().click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Obtiene el valor del subtotal calculado
   */
  async getSubTotal(): Promise<string> {
    return await this.subTotalField.inputValue();
  }

  /**
   * Obtiene el valor del total de impuestos calculado
   */
  async getTaxTotal(): Promise<string> {
    return await this.taxTotalField.inputValue();
  }

  /**
   * Obtiene el valor del total calculado
   */
  async getTotal(): Promise<string> {
    return await this.totalField.inputValue();
  }

  /**
   * Verifica si un campo está habilitado para edición
   * @param fieldName - Nombre del campo a verificar
   */
  async isFieldEditable(fieldName: string): Promise<boolean> {
    let field: Locator;
    
    switch (fieldName) {
      case 'client':
        field = this.clientField;
        break;
      case 'number':
        field = this.numberField;
        break;
      case 'year':
        field = this.yearField;
        break;
      case 'status':
        field = this.statusField;
        break;
      case 'notes':
        field = this.notesField;
        break;
      default:
        return false;
    }
    
    return await field.isEditable();
  }

  /**
   * Guarda los cambios en la factura
   */
  async saveInvoice(): Promise<void> {
    await this.saveButton.click();
    // Esperar a que se procese el guardado
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Cancela la edición y vuelve a la lista
   */
  async cancelEdit(): Promise<void> {
    await this.cancelButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verifica si el formulario de actualización está visible
   */
  async isUpdateFormVisible(): Promise<boolean> {
    return await this.updatePageHeading.isVisible();
  }

  /**
   * Verifica si los campos requeridos muestran errores de validación
   */
  async hasValidationErrors(): Promise<boolean> {
    const errorMessages = this.page.locator('.ant-form-item-explain-error');
    const count = await errorMessages.count();
    return count > 0;
  }

  /**
   * Obtiene el número de items actuales en el formulario
   */
  async getItemsCount(): Promise<number> {
    const itemRows = this.page.getByPlaceholder('Item Name');
    return await itemRows.count();
  }
}
