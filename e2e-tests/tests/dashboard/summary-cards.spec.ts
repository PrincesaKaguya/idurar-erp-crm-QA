import { test, expect } from '../../fixtures/base';

/**
 * CP042: Visualización de Tarjetas de Resumen
 * 
 * Objetivo: Verificar que las 4 tarjetas de resumen muestran datos correctos
 * 
 * Precondiciones:
 * - Usuario autenticado
 * - Sistema con datos de facturas, cotizaciones y pagos
 */

test.describe('CP042 - Dashboard Summary Cards', () => {

  test.beforeEach(async ({ page }) => {
    // Navegar al dashboard
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  });  /**
   * TEST 1: Verificar que las 4 tarjetas son visibles con datos
   */
  test('should display all 4 summary cards with valid data', async ({ dashboardPage }) => {
    // Esperar a que las tarjetas carguen completamente
    await dashboardPage.waitForSummaryCardsToLoad();
    
    // Esperar explícitamente a que aparezca al menos una tarjeta
    await dashboardPage.page.waitForSelector('.whiteBox.shadow', { state: 'visible', timeout: 15000 });
    
    // Verificar visibilidad de las 4 tarjetas con timeout extendido
    await expect(dashboardPage.invoicesSummaryCard).toBeVisible({ timeout: 15000 });
    await expect(dashboardPage.quotesSummaryCard).toBeVisible({ timeout: 15000 });
    await expect(dashboardPage.paidSummaryCard).toBeVisible({ timeout: 15000 });
    await expect(dashboardPage.unpaidSummaryCard).toBeVisible({ timeout: 15000 });
    
    // Verificar que todas tienen datos (no están vacías)
    const invoicesAmount = await dashboardPage.getSummaryCardAmount(dashboardPage.invoicesSummaryCard);
    const quotesAmount = await dashboardPage.getSummaryCardAmount(dashboardPage.quotesSummaryCard);
    const paidAmount = await dashboardPage.getSummaryCardAmount(dashboardPage.paidSummaryCard);
    const unpaidAmount = await dashboardPage.getSummaryCardAmount(dashboardPage.unpaidSummaryCard);
    
    expect(invoicesAmount.trim().length).toBeGreaterThan(0);
    expect(quotesAmount.trim().length).toBeGreaterThan(0);
    expect(paidAmount.trim().length).toBeGreaterThan(0);
    expect(unpaidAmount.trim().length).toBeGreaterThan(0);
    
    // Verificar que no hay spinners de carga
    const invoicesLoading = await dashboardPage.isSummaryCardLoading(dashboardPage.invoicesSummaryCard);
    expect(invoicesLoading).toBeFalsy();
  });

  /**
   * TEST 2: Verificar títulos y prefijos correctos
   */
  test('should display correct titles and prefixes', async ({ dashboardPage }) => {
    await dashboardPage.waitForSummaryCardsToLoad();
    
    // Obtener todos los datos de las tarjetas
    const allData = await dashboardPage.getAllSummaryCardsData();
    
    // Verificar que hay exactamente 4 tarjetas
    expect(allData.length).toBe(4);
    
    // Verificar que cada tarjeta tiene datos completos
    allData.forEach((card, index) => {
      expect(card.title.trim()).toBeTruthy();
      expect(card.prefix.trim()).toBeTruthy();
      expect(card.amount.trim()).toBeTruthy();
    });
    
    // Verificar títulos específicos
    const invoicesTitle = await dashboardPage.getSummaryCardTitle(dashboardPage.invoicesSummaryCard);
    expect(invoicesTitle.toLowerCase()).toContain('invoice');
    
    const quotesTitle = await dashboardPage.getSummaryCardTitle(dashboardPage.quotesSummaryCard);
    expect(quotesTitle.toLowerCase()).toContain('quote');
    
    // Verificar prefijos
    const invoicesPrefix = await dashboardPage.getSummaryCardPrefix(dashboardPage.invoicesSummaryCard);
    expect(invoicesPrefix.toLowerCase()).toMatch(/this month|este mes/i);
    
    const unpaidPrefix = await dashboardPage.getSummaryCardPrefix(dashboardPage.unpaidSummaryCard);
    expect(unpaidPrefix.toLowerCase()).toMatch(/not paid|no pagado/i);
  });

  /**
   * TEST 3: Verificar formato de moneda válido
   */
  test('should display amounts with valid currency format', async ({ dashboardPage }) => {
    await dashboardPage.waitForSummaryCardsToLoad();
    
    const cards = [
      dashboardPage.invoicesSummaryCard,
      dashboardPage.quotesSummaryCard,
      dashboardPage.paidSummaryCard,
      dashboardPage.unpaidSummaryCard
    ];
    
    // Verificar formato y valores válidos para cada tarjeta
    for (const card of cards) {
      const amount = await dashboardPage.getSummaryCardAmount(card);
      const numericValue = dashboardPage.extractNumericValue(amount);
      
      // Verificar formato de moneda válido (ej: $1,234.56)
      expect(dashboardPage.isValidCurrencyFormat(amount)).toBeTruthy();
      
      // Verificar que el valor numérico es >= 0 y no es NaN
      expect(numericValue).toBeGreaterThanOrEqual(0);
      expect(isNaN(numericValue)).toBeFalsy();
    }
  });
});
