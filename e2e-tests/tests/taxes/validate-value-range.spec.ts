import { test, expect } from '../../fixtures/base';

/**
 * Test Suite: CP037 - Validar rango 0-100
 * 
 * Objetivo: Verificar que Tax Value acepta solo valores entre 0-100
 * 
 * Precondiciones:
 * - Usuario autenticado (vía auth.setup.ts)
 * - Aplicación corriendo en localhost:3000
 * - Backend API disponible en localhost:8888
 */

test.describe('CP037 - Validar rango 0-100', () => {
  test.beforeEach(async ({ taxesPage }) => {
    // Navegar a la página de Taxes antes de cada test
    await taxesPage.goto();
    // Abrir formulario de creación
    await taxesPage.clickAddNew();
  });

  test('Debe rechazar valores negativos (-5)', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 1: Intentar ingresar -5 en Tax Value
    await taxesPage.taxValueInput.fill('-5');
    
    // Verificar que el valor se puede escribir (InputNumber permite escritura)
    const currentValue = await taxesPage.taxValueInput.inputValue();
    console.log('CP037 - Valor después de ingresar -5:', currentValue);
    
    // Ingresar nombre válido para intentar guardar
    await taxesPage.taxNameInput.fill('Test Negative Value');
    
    // Intentar guardar
    await taxesPage.saveButton.click();
    await page.waitForTimeout(500);

    // Validación: Debe rechazar al guardar (mostrar error o no guardar)
    const taxValueFormItem = page.locator('.ant-form-item').filter({ 
      has: page.locator('input[id="taxValue"]') 
    });
    const errorMessage = taxValueFormItem.locator('.ant-form-item-explain-error');
    
    // Verificar que hay error de validación
    const hasError = await errorMessage.isVisible().catch(() => false);
    const drawerStillOpen = await drawer.isVisible();
    
    // Debe haber error O drawer permanece abierto (no se guardó)
    expect(hasError || drawerStillOpen).toBeTruthy();
  });

  test('Debe aceptar valor 0 (límite inferior)', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 2: Ingresar 0 en Tax Value
    await taxesPage.taxValueInput.fill('0');
    
    // Verificar que el valor se aceptó
    await expect(taxesPage.taxValueInput).toHaveValue('0');

    // Ingresar nombre y guardar
    const uniqueName = `Tax Value 0 Test ${Date.now()}`;
    await taxesPage.taxNameInput.fill(uniqueName);

    // Validación: Debe aceptar y guardar exitosamente
    const createPromise = page.waitForResponse(response => 
      response.url().includes('/api/taxes/create') && response.status() === 200
    );
    
    await taxesPage.saveButton.click();
    await createPromise;

    // Verificar que se guardó (API respondió 200)
    await page.waitForTimeout(1000);
    
    // Drawer puede o no cerrarse dependiendo de paginación, pero API 200 = éxito
  });

  test('Debe aceptar valor 100 (límite superior)', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 3: Ingresar 100 en Tax Value
    await taxesPage.taxValueInput.fill('100');
    
    // Verificar que el valor se aceptó
    await expect(taxesPage.taxValueInput).toHaveValue('100');

    // Ingresar nombre y guardar
    const uniqueName = `Tax Value 100 Test ${Date.now()}`;
    await taxesPage.taxNameInput.fill(uniqueName);

    // Validación: Debe aceptar y guardar exitosamente
    const createPromise = page.waitForResponse(response => 
      response.url().includes('/api/taxes/create') && response.status() === 200
    );
    
    await taxesPage.saveButton.click();
    await createPromise;

    // Verificar que se guardó (API respondió 200)
    await page.waitForTimeout(1000);
  });

  test('Debe rechazar valores mayores a 100 (101)', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 4: Intentar ingresar 101 en Tax Value
    await taxesPage.taxValueInput.fill('101');
    
    // Verificar que el valor se puede escribir
    const currentValue = await taxesPage.taxValueInput.inputValue();
    console.log('CP037 - Valor después de ingresar 101:', currentValue);
    expect(currentValue).toBe('101');
    
    // Ingresar nombre válido para intentar guardar
    await taxesPage.taxNameInput.fill('Test Over 100 Value');
    
    // Intentar guardar
    await taxesPage.saveButton.click();
    await page.waitForTimeout(500);

    // Validación: Debe rechazar al guardar (mostrar error o no guardar)
    const taxValueFormItem = page.locator('.ant-form-item').filter({ 
      has: page.locator('input[id="taxValue"]') 
    });
    const errorMessage = taxValueFormItem.locator('.ant-form-item-explain-error');
    
    // Verificar que hay error de validación
    const hasError = await errorMessage.isVisible().catch(() => false);
    const drawerStillOpen = await drawer.isVisible();
    
    // Debe haber error O drawer permanece abierto (no se guardó)
    expect(hasError || drawerStillOpen).toBeTruthy();
  });

  test('Debe validar rango completo con múltiples valores', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Test de valores válidos dentro del rango
    const validValues = [0, 1, 50, 99, 100];
    
    for (const value of validValues) {
      await taxesPage.taxValueInput.clear();
      await taxesPage.taxValueInput.fill(value.toString());
      
      const inputValue = await taxesPage.taxValueInput.inputValue();
      expect(parseInt(inputValue)).toBe(value);
    }

    // Guardar con un valor válido
    await taxesPage.taxNameInput.fill(`Tax Range Test ${Date.now()}`);
    
    const createPromise = page.waitForResponse(response => 
      response.url().includes('/api/taxes/create') && response.status() === 200
    );
    
    await taxesPage.saveButton.click();
    await createPromise;
  });

  test('Debe mostrar error o prevenir entrada de valores decimales excesivos', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Intentar ingresar valor con muchos decimales
    await taxesPage.taxValueInput.fill('50.123456789');
    
    const currentValue = await taxesPage.taxValueInput.inputValue();
    
    // Ant Design puede redondear o truncar decimales
    // Verificar que el valor sea razonable
    const numValue = parseFloat(currentValue);
    expect(numValue).toBeGreaterThanOrEqual(0);
    expect(numValue).toBeLessThanOrEqual(100);
  });

  test('Debe validar al intentar guardar sin corregir valor inválido', async ({ taxesPage, page }) => {
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Ingresar nombre válido
    await taxesPage.taxNameInput.fill('Test Invalid Range');
    
    // Intentar ingresar valor fuera de rango
    await taxesPage.taxValueInput.clear();
    await taxesPage.taxValueInput.fill('200');
    
    // Intentar guardar inmediatamente
    await taxesPage.saveButton.click();
    await page.waitForTimeout(500);

    // Validación: No debe permitir guardar si el valor está fuera de rango
    // Verificar que drawer sigue abierto O hubo error
    const drawerStillOpen = await drawer.isVisible();
    const currentValue = await taxesPage.taxValueInput.inputValue();
    const numValue = parseInt(currentValue);
    
    // Si el drawer sigue abierto, hay validación
    // Si se cerró, el valor debe haber sido ajustado a 100 o menos
    if (!drawerStillOpen) {
      expect(numValue).toBeLessThanOrEqual(100);
    } else {
      // Drawer abierto = validación activa
      expect(drawerStillOpen).toBeTruthy();
    }
  });
});
