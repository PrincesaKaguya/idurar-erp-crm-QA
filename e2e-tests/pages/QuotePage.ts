import { Page, Locator } from '@playwright/test';

export class QuotePage {
  readonly page: Page;
  readonly addNewQuoteButton: Locator;
  readonly clientSelect: Locator;
  readonly numberInput: Locator;
  readonly yearInput: Locator;
  readonly statusSelect: Locator;
  readonly dateField: Locator;
  readonly expiredDateField: Locator;
  readonly notesInput: Locator;
  readonly addFieldButton: Locator;
  readonly taxRateSelect: Locator;
  readonly saveButton: Locator;
  readonly successNotification: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addNewQuoteButton = page.getByRole('button', { name: /add new quote/i });
    this.clientSelect = page.locator('[id*="client"]').first();
    this.numberInput = page.locator('[id*="number"]');
    this.yearInput = page.locator('[id*="year"]');
    this.statusSelect = page.locator('[id*="status"]');
    this.dateField = page.locator('[id*="date"]').first();
    this.expiredDateField = page.locator('[id*="expiredDate"]');
    this.notesInput = page.locator('[id*="notes"]');
    this.addFieldButton = page.getByRole('button', { name: /add field/i });
    this.taxRateSelect = page.locator('[id*="taxRate"]').first();
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.successNotification = page.locator('.ant-notification-notice-success');
  }

  async goto() {
    await this.page.goto('/quote');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickAddNewQuote() {
    await this.addNewQuoteButton.click();
  }

  async selectClient(clientName: string) {
    // Esperar a que el campo de cliente esté disponible
    await this.page.waitForSelector('.ant-select-selector', { timeout: 10000 });
    
    // Click en el selector de cliente
    const clientSelector = this.page.locator('.ant-select-selector').first();
    await clientSelector.click();
    
    // Esperar y seleccionar el primer cliente disponible
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  async fillItemRow(index: number, itemData: { item: string, description: string, quantity: number, price: number }) {
    // Usar nth para seleccionar los inputs dentro de los Form.Items de la lista
    const items = this.page.locator('.ant-row.ant-form-item');
    
    await this.page.locator(`input`).nth(4 + index * 4).fill(itemData.item); // itemName
    await this.page.locator(`textarea`).nth(index).fill(itemData.description); // description
    await this.page.locator(`input[type="text"]`).nth(8 + index * 3).fill(itemData.quantity.toString()); // quantity
    await this.page.locator(`input[type="text"]`).nth(9 + index * 3).fill(itemData.price.toString()); // price
  }

  async selectTaxRate(taxName: string) {
    // Esperar al campo de Tax Rate
    await this.page.waitForTimeout(500);
    
    // Buscar el selector que tiene "Select Tax Value" como placeholder
    const taxSelector = this.page.locator('.ant-select-selector').nth(1);
    await taxSelector.click();
    
    // Seleccionar el primer impuesto disponible
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async waitForSuccessNotification() {
    await this.successNotification.waitFor({ state: 'visible', timeout: 10000 });
  }

  async isQuoteCreated(): Promise<boolean> {
    try {
      await this.successNotification.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
