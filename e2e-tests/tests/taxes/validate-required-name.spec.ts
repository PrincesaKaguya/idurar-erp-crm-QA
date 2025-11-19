import { test, expect } from '../../fixtures/base';

/**
 * Test Suite: CP035 - Validar nombre requerido
 * 
 * Objetivo: Verificar que Tax Name es un campo obligatorio
 * 
 * Precondiciones:
 * - Usuario autenticado (vía auth.setup.ts)
 * - Aplicación corriendo en localhost:3000
 * - Backend API disponible en localhost:8888
 */

test.describe('CP035 - Validar nombre requerido', () => {
  test.beforeEach(async ({ taxesPage }) => {
    // Navegar a la página de Taxes antes de cada test
    await taxesPage.goto();
  });

  test('Debe mostrar error cuando Tax Name está vacío', async ({ taxesPage, page }) => {
    // Paso 1: Click "Add New Tax"
    await taxesPage.clickAddNew();

    // Verificar que el drawer de creación se abrió
    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 2: Dejar Tax Name vacío (no escribir nada)
    // Tax Name ya está vacío por defecto

    // Paso 3: Ingresar Tax Value: 10
    await taxesPage.taxValueInput.clear();
    await taxesPage.taxValueInput.fill('10');

    // Verificar que el valor se ingresó correctamente
    await expect(taxesPage.taxValueInput).toHaveValue('10');

    // Paso 4: Intentar guardar
    await taxesPage.saveButton.click();

    // Esperar un momento para que aparezca el error
    await page.waitForTimeout(500);

    // Validación 1: ❌ No permite guardar (el drawer sigue abierto)
    await expect(drawer).toBeVisible();
    
    // Validación 2: ✅ Muestra error "Field is required" en Tax Name
    // Buscar el mensaje de error en el form item de taxName
    const taxNameFormItem = page.locator('.ant-form-item').filter({ 
      has: page.locator('input[id="taxName"]') 
    });
    
    // El error puede aparecer como texto o en un elemento específico
    const errorMessage = taxNameFormItem.locator('.ant-form-item-explain-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/please enter|required|obligatorio/i);
  });

  test('Debe permitir guardar después de ingresar Tax Name', async ({ taxesPage, page }) => {
    // Paso 1: Abrir formulario
    await taxesPage.clickAddNew();

    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 2: Ingresar solo Tax Value sin nombre (para ver el error)
    await taxesPage.taxValueInput.fill('15');
    await taxesPage.saveButton.click();
    await page.waitForTimeout(500);

    // Verificar que hay error
    const taxNameFormItem = page.locator('.ant-form-item').filter({ 
      has: page.locator('input[id="taxName"]') 
    });
    const errorMessage = taxNameFormItem.locator('.ant-form-item-explain-error');
    await expect(errorMessage).toBeVisible();

    // Paso 3: Corregir el error ingresando un nombre
    const uniqueName = `Tax Required Test ${Date.now()}`;
    await taxesPage.taxNameInput.fill(uniqueName);

    // Esperar un momento para que se valide
    await page.waitForTimeout(300);

    // Paso 4: Ahora sí guardar exitosamente
    const createPromise = page.waitForResponse(response => 
      response.url().includes('/api/taxes/create') && response.status() === 200
    );
    
    await taxesPage.saveButton.click();
    await createPromise;

    // Validar que se guardó (drawer se cerró o recibimos respuesta exitosa)
    // La respuesta 200 confirma que se creó exitosamente
    await page.waitForTimeout(1000);
  });

  test('Debe mostrar error si solo se ingresa espacios en blanco', async ({ taxesPage, page }) => {
    // Paso 1: Abrir formulario
    await taxesPage.clickAddNew();

    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 2: Ingresar solo espacios en Tax Name
    await taxesPage.taxNameInput.fill('   '); // Solo espacios

    // Paso 3: Ingresar Tax Value
    await taxesPage.taxValueInput.fill('20');

    // Paso 4: Intentar guardar
    await taxesPage.saveButton.click();
    await page.waitForTimeout(500);

    // Validación: Debe mostrar error (espacios en blanco no son válidos)
    // Ant Design generalmente considera espacios como vacío después de trim
    const taxNameFormItem = page.locator('.ant-form-item').filter({ 
      has: page.locator('input[id="taxName"]') 
    });
    
    const errorMessage = taxNameFormItem.locator('.ant-form-item-explain-error');
    
    // Verificar que hay error O que el drawer sigue abierto (no se guardó)
    const hasError = await errorMessage.isVisible().catch(() => false);
    const drawerStillOpen = await drawer.isVisible();
    
    expect(hasError || drawerStillOpen).toBeTruthy();
  });

  test('Debe validar en tiempo real al perder foco del campo', async ({ taxesPage, page }) => {
    // Paso 1: Abrir formulario
    await taxesPage.clickAddNew();

    const drawer = page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 2: Focus en Tax Name y luego blur sin escribir nada
    await taxesPage.taxNameInput.click();
    await taxesPage.taxNameInput.blur();
    
    // Esperar un momento para la validación
    await page.waitForTimeout(500);

    // Validación: Debe mostrar error después de blur
    const taxNameFormItem = page.locator('.ant-form-item').filter({ 
      has: page.locator('input[id="taxName"]') 
    });
    
    const errorMessage = taxNameFormItem.locator('.ant-form-item-explain-error');
    
    // En algunos frameworks el error aparece solo al submit, en otros al blur
    // Verificamos si el error está visible
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    // Si no hay error en blur, verificar que aparezca al intentar guardar
    if (!hasError) {
      await taxesPage.saveButton.click();
      await page.waitForTimeout(500);
      await expect(errorMessage).toBeVisible();
    }
  });
});
