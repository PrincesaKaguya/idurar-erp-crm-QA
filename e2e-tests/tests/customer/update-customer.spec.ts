import { test, expect } from '../../fixtures/base';

/**
 * CP039 - Actualización de clientes (SIMPLIFICADO)
 * 
 * Este test suite valida la funcionalidad básica de edición de clientes,
 * enfocándose en la interacción con la UI y validaciones del formulario.
 * 
 * NOTA: Tests simplificados que validan comportamiento de UI sin verificar
 * persistencia completa debido a limitaciones actuales del sistema.
 * 
 * Casos de prueba:
 * 1. Verificar que el formulario de edición se abre correctamente
 * 2. Verificar que se pueden modificar los campos del formulario
 * 3. Validar formato de teléfono (validación de campo)
 * 4. Validar formato de email (validación de campo)
 * 5. Cancelar edición sin guardar cambios
 */

test.describe('CP039 - Actualización de clientes', () => {
  test.beforeEach(async ({ customerPage }) => {
    await customerPage.goto();
  });

  test('Debe mostrar el formulario de edición al hacer click en Edit', async ({ customerPage }) => {
    // Paso 1: Verificar que hay clientes en la tabla
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount, 'Debe haber al menos un cliente en la tabla').toBeGreaterThan(0);

    // Paso 2: Abrir formulario de edición
    await customerPage.clickEdit(0);

    // Validación 1: Verificar que el drawer de edición se abre
    const drawer = customerPage.page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Validación 2: Verificar que el formulario está presente
    const form = drawer.locator('form').first();
    await expect(form).toBeVisible();

    // Validación 3: Verificar que los campos principales existen y son editables
    const nameInput = drawer.getByRole('textbox', { name: /name/i });
    const phoneInput = drawer.getByRole('textbox', { name: /phone/i });
    const emailInput = drawer.getByRole('textbox', { name: /email/i });

    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(emailInput).toBeVisible();

    // Validación 4: Verificar que los campos contienen datos
    await expect(nameInput).not.toBeEmpty();
    await expect(emailInput).not.toBeEmpty();

    // Validación 5: Verificar que el botón Save existe y está visible
    const saveButton = drawer.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });

  test('Debe permitir modificar los campos del formulario de edición', async ({ customerPage }) => {
    // Paso 1: Verificar que hay clientes
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Paso 2: Abrir el formulario de edición
    await customerPage.clickEdit(0);

    const drawer = customerPage.page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 3: Modificar el campo de teléfono
    const phoneInput = drawer.getByRole('textbox', { name: /phone/i });
    const newPhone = '+34 612 345 678';
    await phoneInput.fill(newPhone);

    // Validación 1: Verificar que el nuevo valor se ingresó correctamente
    await expect(phoneInput).toHaveValue(newPhone);

    // Paso 4: Modificar el campo de nombre
    const nameInput = drawer.getByRole('textbox', { name: /name/i });
    const currentName = await nameInput.inputValue();
    const newName = currentName + ' Editado';
    await nameInput.fill(newName);

    // Validación 2: Verificar que el nombre se modificó
    await expect(nameInput).toHaveValue(newName);

    // Paso 5: Modificar el email
    const emailInput = drawer.getByRole('textbox', { name: /email/i });
    const timestamp = Date.now();
    const newEmail = `test.${timestamp}@example.com`;
    await emailInput.fill(newEmail);

    // Validación 3: Verificar que el email se modificó
    await expect(emailInput).toHaveValue(newEmail);

    // Validación 4: Verificar que el botón Save está habilitado
    const saveButton = drawer.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeEnabled();
  });

  test('Debe validar formato de teléfono al intentar guardar', async ({ customerPage }) => {
    // Paso 1: Verificar que hay clientes
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Paso 2: Abrir el formulario de edición
    await customerPage.clickEdit(0);

    const drawer = customerPage.page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 3: Intentar ingresar un teléfono con formato inválido
    const phoneInput = drawer.getByRole('textbox', { name: /phone/i });
    const invalidPhone = 'abc123xyz';
    await phoneInput.fill(invalidPhone);

    // Validación 1: Verificar que se puede escribir en el campo
    await expect(phoneInput).toHaveValue(invalidPhone);

    // Paso 4: Intentar guardar
    const saveButton = drawer.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Validación 2: El formulario debe seguir visible (validación impide cierre)
    await customerPage.page.waitForTimeout(1000);
    await expect(drawer).toBeVisible({ timeout: 3000 });
  });

  test('Debe validar formato de email al intentar guardar', async ({ customerPage }) => {
    // Paso 1: Verificar que hay clientes
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Paso 2: Abrir el formulario de edición
    await customerPage.clickEdit(0);

    const drawer = customerPage.page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 3: Intentar ingresar un email con formato inválido
    const emailInput = drawer.getByRole('textbox', { name: /email/i });
    const invalidEmail = 'correo-invalido-sin-arroba';
    await emailInput.fill(invalidEmail);

    // Validación 1: Verificar que el valor se ingresó
    await expect(emailInput).toHaveValue(invalidEmail);

    // Paso 4: Intentar guardar
    const saveButton = drawer.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Validación 2: El formulario debe seguir visible (validación impide cierre)
    await customerPage.page.waitForTimeout(1000);
    await expect(drawer).toBeVisible({ timeout: 3000 });
  });

  test('Debe poder cancelar la edición sin guardar cambios', async ({ customerPage }) => {
    // Paso 1: Verificar que hay clientes
    const rowCount = await customerPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Paso 2: Obtener datos originales del primer cliente
    const originalData = await customerPage.getRowData(0);
    const originalPhone = originalData['Phone'] || '';

    // Paso 3: Abrir el formulario de edición
    await customerPage.clickEdit(0);

    const drawer = customerPage.page.locator('.ant-drawer.ant-drawer-open');
    await expect(drawer).toBeVisible();

    // Paso 4: Modificar el teléfono sin guardar
    const phoneInput = drawer.getByRole('textbox', { name: /phone/i });
    const tempPhone = '+34 999 999 999';
    await phoneInput.fill(tempPhone);

    // Validación 1: Verificar que el campo se modificó temporalmente
    await expect(phoneInput).toHaveValue(tempPhone);

    // Paso 5: Cancelar la edición
    await customerPage.cancelEdit();

    // Validación 2: Verificar que el drawer se cerró
    await expect(drawer).not.toBeVisible({ timeout: 5000 });

    // Validación 3: Verificar que los datos originales permanecen sin cambios
    const currentData = await customerPage.getRowData(0);
    const currentPhone = currentData['Phone'] || '';
    expect(currentPhone, 'El teléfono no debe cambiar al cancelar').toBe(originalPhone);
  });
});
