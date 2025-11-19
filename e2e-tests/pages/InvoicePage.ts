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
  
  // Search elements
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly dataTable: Locator;

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
    
    // Search elements - basados en SearchItem component de IDURAR
    // SearchItem es un Ant Design Select con showSearch=true
    this.searchInput = page.locator('.ant-select-show-search input').first();
    this.searchClearButton = page.locator('.ant-select-clear').first();
    this.dataTable = page.locator('.ant-table');
  }

  /**
   * Navega a la página principal de facturas
   */
  async goto(): Promise<void> {
    await this.page.goto('/invoice');
    // Esperar a que el contenido esté cargado - usamos selector menos estricto
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000); // Dar tiempo para virtualización
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

  /**
   * SEARCH METHODS - CP041
   */

  /**
   * Busca facturas por nombre de cliente
   * @param clientName - Nombre del cliente a buscar
   */
  async searchByClient(clientName: string): Promise<void> {
    // Asegurar que estamos en la página principal
    if (!this.page.url().includes('/invoice') || this.page.url().includes('/update')) {
      await this.goto();
    }

    // Hacer click en el input de búsqueda para enfocarlo
    await this.searchInput.click();
    
    // Escribir el nombre del cliente
    await this.searchInput.fill(clientName);
    
    // Esperar a que cargue el autocompletado
    await this.page.waitForTimeout(500);
    
    // Presionar Enter o seleccionar de la lista si aparece
    const dropdownOption = this.page.locator('.ant-select-item-option').filter({ hasText: clientName }).first();
    
    if (await dropdownOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dropdownOption.click();
    } else {
      // Si no hay dropdown, presionar Enter
      await this.searchInput.press('Enter');
    }
    
    // Esperar a que la tabla se actualice
    await this.page.waitForTimeout(1000);
  }

  /**
   * Limpia la búsqueda actual
   */
  async clearSearch(): Promise<void> {
    // Si el botón de limpiar está visible, hacer click
    if (await this.searchClearButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.searchClearButton.click();
      await this.page.waitForTimeout(500);
    } else {
      // Alternativamente, limpiar el input directamente
      await this.searchInput.click();
      await this.searchInput.clear();
      await this.searchInput.press('Escape');
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Obtiene el número de filas visibles en la tabla de resultados
   * @returns Número de filas en la tabla
   */
  async getTableRowCount(): Promise<number> {
    // No esperar - si la tabla no está, devolver 0
    try {
      await this.dataTable.waitFor({ state: 'attached', timeout: 3000 });
      
      // Contar las filas del tbody (excluir header)
      const rows = this.dataTable.locator('tbody tr.ant-table-row');
      return await rows.count();
    } catch {
      // Si falla, devolver 0
      return 0;
    }
  }

  /**
   * Verifica si la tabla contiene un cliente específico en los resultados
   * @param clientName - Nombre del cliente a verificar
   * @returns true si el cliente está en los resultados
   */
  async tableContainsClient(clientName: string): Promise<boolean> {
    const clientCell = this.dataTable.locator(`td:has-text("${clientName}")`).first();
    return await clientCell.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Verifica si la tabla muestra el mensaje "No data"
   * @returns true si no hay datos
   */
  async isTableEmpty(): Promise<boolean> {
    const emptyMessage = this.page.locator('.ant-empty-description');
    return await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);
  }
}
