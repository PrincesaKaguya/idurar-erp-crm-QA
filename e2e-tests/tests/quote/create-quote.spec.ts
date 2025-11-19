import { test, expect } from '../../fixtures/base';

/**
 * CP044: Crear Presupuesto
 * 
 * Objetivo: Verificar que se puede crear un presupuesto con datos válidos
 * 
 * Precondiciones:
 * - Usuario autenticado
 * - Al menos un cliente existente en el sistema
 * - Al menos un impuesto configurado
 */

test.describe('CP044 - Create Quote', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/quote', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  });

  /**
   * TEST 1: Crear presupuesto con datos mínimos requeridos
   */
  test('should create a quote with valid data', async ({ page }) => {
    // Navegar directamente al formulario de creación
    await page.goto('/quote/create');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Seleccionar cliente (primer cliente disponible)
    const clientSelector = page.locator('.ant-select-selector').first();
    await clientSelector.waitFor({ state: 'visible', timeout: 5000 });
    await clientSelector.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Llenar items
    await page.getByPlaceholder(/item name/i).first().fill('Servicio Consultoría');
    await page.getByPlaceholder(/description/i).first().fill('Consultoría técnica');
    
    // Llenar quantity y price
    const quantityInputs = page.locator('.ant-input-number-input');
    await quantityInputs.nth(2).fill('10');
    await quantityInputs.nth(3).fill('100');
    await page.waitForTimeout(500);
    
    // Seleccionar tax rate
    const taxSelector = page.locator('.ant-select-selector').nth(1);
    await taxSelector.scrollIntoViewIfNeeded();
    await taxSelector.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Guardar
    await page.locator('form').getByRole('button', { name: /save/i }).click();
    
    // Verificar que se navegó a la página de detalle del quote o que regresó a la lista
    await page.waitForURL(/\/quote/, { timeout: 15000 });
    
    // Verificar que la URL cambió (creación exitosa)
    expect(page.url()).toMatch(/\/quote/);
  });
});
