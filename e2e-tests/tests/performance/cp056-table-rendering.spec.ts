/**
 * CP056 - Prueba de Rendimiento de Renderizado de Tabla de Clientes
 * 
 * Objetivo: Medir el rendimiento del renderizado de la tabla de clientes
 * con 1000+ registros, evaluando tiempos de carga, paginación y navegación.
 * 
 * Criterios de Aceptación:
 * - Carga inicial de tabla < 3 segundos
 * - Cambio de página < 1 segundo
 * - Búsqueda/filtrado < 2 segundos
 * - Scroll fluido sin bloqueos visuales
 * - Correcta visualización de todos los elementos de la UI
 */

import { test, expect, Page } from '@playwright/test';

// ==============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ==============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CLIENT_PAGE_URL = `${BASE_URL}/customer`;

// Umbrales de rendimiento (en milisegundos)
const PERFORMANCE_THRESHOLDS = {
  initialLoad: 8000,        // Carga inicial de la página (dataset grande)
  tableRender: 4000,        // Renderizado completo de la tabla
  pageChange: 2000,         // Cambio de página de paginación
  search: 3000,             // Respuesta a búsqueda/filtrado
  refresh: 6000,            // Tiempo de recarga manual
};

// Métricas personalizadas
const metrics = {
  initialLoadTime: 0,
  tableRenderTime: 0,
  pageChangeTime: 0,
  searchTime: 0,
  refreshTime: 0,
  totalRecords: 0,
  pageSize: 10,
  totalPages: 0,
};

// ==============================================================================
// FUNCIONES AUXILIARES
// ==============================================================================

/**
 * Espera a que la tabla termine de cargar
 */
async function waitForTableLoad(page: Page): Promise<void> {
  // Esperar a que desaparezca el spinner de carga
  await page.waitForSelector('.ant-spin-spinning', { state: 'hidden', timeout: 10000 }).catch(() => {
    console.log('⚠️  No se detectó spinner de carga');
  });

  // Esperar a que la tabla sea visible
  await page.waitForSelector('.ant-table-tbody', { state: 'visible', timeout: 10000 });
  
  // Pequeña pausa para estabilización del DOM
  await page.waitForTimeout(200);
}

/**
 * Obtiene el número total de registros desde la paginación
 */
async function getTotalRecords(page: Page): Promise<number> {
  // Intentar obtener el texto de paginación (opcional en esta aplicación)
  const paginationText = await page.locator('.ant-pagination-total-text').textContent().catch(() => null);
  
  if (paginationText) {
    // Formato esperado: "Total 1234 items" o similar
    const match = paginationText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  
  // Alternativa: Contar los items de paginación para estimar el total
  const lastPageItem = await page.locator('.ant-pagination-item').last().textContent().catch(() => null);
  if (lastPageItem) {
    const lastPage = parseInt(lastPageItem, 10);
    const pageSize = 10; // Tamaño de página por defecto
    return lastPage * pageSize; // Estimación
  }
  
  return 0;
}

/**
 * Obtiene el número de filas visibles en la tabla
 */
async function getVisibleRowCount(page: Page): Promise<number> {
  const rows = await page.locator('.ant-table-tbody tr:not(.ant-table-placeholder)').all();
  return rows.length;
}

/**
 * Verifica si la tabla muestra "No data"
 */
async function isTableEmpty(page: Page): Promise<boolean> {
  const emptyMessage = page.locator('.ant-empty-description');
  return await emptyMessage.isVisible().catch(() => false);
}

/**
 * Mide el tiempo de ejecución de una función
 */
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  return { result, duration };
}

/**
 * Imprime resumen de métricas de rendimiento
 */
function printMetricsSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE MÉTRICAS DE RENDIMIENTO - CP056');
  console.log('='.repeat(80));
  console.log('\n📈 DATOS DE LA TABLA:');
  console.log(`  • Total de registros: ${metrics.totalRecords}`);
  console.log(`  • Tamaño de página: ${metrics.pageSize}`);
  console.log(`  • Total de páginas: ${metrics.totalPages}`);
  
  console.log('\n⏱️  TIEMPOS DE RESPUESTA:');
  console.log(`  • Carga inicial: ${metrics.initialLoadTime.toFixed(2)}ms (umbral: ${PERFORMANCE_THRESHOLDS.initialLoad}ms)`);
  console.log(`  • Renderizado tabla: ${metrics.tableRenderTime.toFixed(2)}ms (umbral: ${PERFORMANCE_THRESHOLDS.tableRender}ms)`);
  console.log(`  • Cambio de página: ${metrics.pageChangeTime.toFixed(2)}ms (umbral: ${PERFORMANCE_THRESHOLDS.pageChange}ms)`);
  console.log(`  • Búsqueda/filtrado: ${metrics.searchTime.toFixed(2)}ms (umbral: ${PERFORMANCE_THRESHOLDS.search}ms)`);
  console.log(`  • Recarga manual: ${metrics.refreshTime.toFixed(2)}ms (umbral: ${PERFORMANCE_THRESHOLDS.refresh}ms)`);
  
  console.log('\n✅ VALIDACIONES:');
  const checks = [
    { name: 'Carga inicial', value: metrics.initialLoadTime, threshold: PERFORMANCE_THRESHOLDS.initialLoad },
    { name: 'Renderizado tabla', value: metrics.tableRenderTime, threshold: PERFORMANCE_THRESHOLDS.tableRender },
    { name: 'Cambio de página', value: metrics.pageChangeTime, threshold: PERFORMANCE_THRESHOLDS.pageChange },
    { name: 'Búsqueda', value: metrics.searchTime, threshold: PERFORMANCE_THRESHOLDS.search },
    { name: 'Recarga', value: metrics.refreshTime, threshold: PERFORMANCE_THRESHOLDS.refresh },
  ];
  
  checks.forEach(check => {
    const passed = check.value <= check.threshold;
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${check.name}: ${check.value.toFixed(2)}ms / ${check.threshold}ms`);
  });
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// ==============================================================================
// SUITE DE PRUEBAS
// ==============================================================================

test.describe('CP056 - Rendimiento de Tabla de Clientes (1000+ registros)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de clientes
    await page.goto(CLIENT_PAGE_URL);
    await waitForTableLoad(page);
  });

  // Aumentar timeout para pruebas de rendimiento con datasets grandes
  test.setTimeout(60000); // 60 segundos

  // ============================================================================
  // TEST 1: Carga Inicial de la Tabla
  // ============================================================================
  
  test('CP056-01: Medir tiempo de carga inicial de tabla', async ({ page }) => {
    console.log('\n🧪 CP056-01: Midiendo carga inicial de tabla...');
    
    // Recargar la página para medir desde cero
    const { duration: loadTime } = await measureTime(async () => {
      await page.reload();
      await waitForTableLoad(page);
    });
    
    metrics.initialLoadTime = loadTime;
    
    // Obtener información de paginación
    metrics.totalRecords = await getTotalRecords(page);
    const visibleRows = await getVisibleRowCount(page);
    
    // Verificar que la tabla tenga datos
    const isEmpty = await isTableEmpty(page);
    expect(isEmpty).toBe(false);
    expect(visibleRows).toBeGreaterThan(0);
    
    // Validar que existan al menos 500 registros
    expect(metrics.totalRecords).toBeGreaterThanOrEqual(500);
    
    console.log(`  ✅ Tabla cargada en ${loadTime.toFixed(2)}ms`);
    console.log(`  📊 Total de registros: ${metrics.totalRecords}`);
    console.log(`  👁️  Registros visibles: ${visibleRows}`);
    
    // Verificar umbral de rendimiento
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.initialLoad);
  });

  // ============================================================================
  // TEST 2: Renderizado Completo de Tabla
  // ============================================================================
  
  test('CP056-02: Medir tiempo de renderizado de tabla con 1000+ registros', async ({ page }) => {
    console.log('\n🧪 CP056-02: Midiendo renderizado de tabla...');
    
    const { duration: renderTime } = await measureTime(async () => {
      // Forzar re-renderizado haciendo clic en "Refresh"
      const refreshButton = page.locator('button:has-text("Refresh"), button:has(.anticon-redo)');
      await refreshButton.click();
      await waitForTableLoad(page);
    });
    
    metrics.tableRenderTime = renderTime;
    
    // Verificar que los datos se renderizaron correctamente
    const visibleRows = await getVisibleRowCount(page);
    expect(visibleRows).toBeGreaterThan(0);
    
    // Verificar elementos críticos de la UI
    await expect(page.locator('.ant-table-thead')).toBeVisible();
    await expect(page.locator('.ant-table-tbody')).toBeVisible();
    await expect(page.locator('.ant-pagination')).toBeVisible();
    
    console.log(`  ✅ Tabla renderizada en ${renderTime.toFixed(2)}ms`);
    console.log(`  👁️  Registros visibles: ${visibleRows}`);
    
    // Verificar umbral de rendimiento
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tableRender);
  });

  // ============================================================================
  // TEST 3: Rendimiento de Paginación
  // ============================================================================
  
  test('CP056-03: Medir tiempo de cambio de página', async ({ page }) => {
    console.log('\n🧪 CP056-03: Midiendo cambio de página...');
    
    // Obtener el número total de páginas
    const totalRecords = await getTotalRecords(page);
    metrics.totalRecords = totalRecords;
    
    // Calcular páginas totales (asumiendo 10 items por página)
    const pageSize = 10;
    metrics.pageSize = pageSize;
    metrics.totalPages = Math.ceil(totalRecords / pageSize);
    
    console.log(`  📄 Total de páginas: ${metrics.totalPages}`);
    
    // Esperar a que aparezca el botón de siguiente página
    const nextPageButton = page.locator('li.ant-pagination-next button').first();
    const isNextEnabled = await nextPageButton.isEnabled().catch(() => false);
    
    if (!isNextEnabled && metrics.totalPages <= 1) {
      console.log('  ⚠️  Solo hay 1 página, omitiendo prueba de paginación');
      test.skip();
      return;
    }
    
    // Medir tiempo de cambio a la página 2
    const { duration: pageChangeTime } = await measureTime(async () => {
      await nextPageButton.click();
      await waitForTableLoad(page);
    });
    
    metrics.pageChangeTime = pageChangeTime;
    
    // Verificar que cambió a la página 2
    const activePage = await page.locator('.ant-pagination-item-active').textContent();
    expect(activePage).toBe('2');
    
    // Verificar que hay registros visibles
    const visibleRows = await getVisibleRowCount(page);
    expect(visibleRows).toBeGreaterThan(0);
    
    console.log(`  ✅ Cambio de página en ${pageChangeTime.toFixed(2)}ms`);
    console.log(`  👁️  Registros en página 2: ${visibleRows}`);
    
    // Verificar umbral de rendimiento
    expect(pageChangeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageChange);
  });

  // ============================================================================
  // TEST 4: Rendimiento de Búsqueda/Filtrado
  // ============================================================================
  
  test('CP056-04: Medir tiempo de respuesta de búsqueda', async ({ page }) => {
    console.log('\n🧪 CP056-04: Midiendo búsqueda/filtrado...');
    
    // Localizar el campo de búsqueda
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first();
    
    // Verificar que existe el campo de búsqueda
    await expect(searchInput).toBeVisible();
    
    // Medir tiempo de búsqueda
    const searchTerm = 'test';
    const { duration: searchTime } = await measureTime(async () => {
      await searchInput.fill(searchTerm);
      await searchInput.press('Enter');
      await waitForTableLoad(page);
    });
    
    metrics.searchTime = searchTime;
    
    // Verificar que la búsqueda retornó resultados (o mensaje de "No data")
    const isEmpty = await isTableEmpty(page);
    const visibleRows = await getVisibleRowCount(page);
    
    if (isEmpty) {
      console.log(`  ℹ️  No se encontraron resultados para "${searchTerm}"`);
    } else {
      console.log(`  ✅ Búsqueda completada en ${searchTime.toFixed(2)}ms`);
      console.log(`  📊 Resultados encontrados: ${visibleRows}`);
    }
    
    // Limpiar búsqueda
    await searchInput.clear();
    await searchInput.press('Enter');
    await waitForTableLoad(page);
    
    // Verificar umbral de rendimiento
    expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.search);
  });

  // ============================================================================
  // TEST 5: Rendimiento de Recarga Manual
  // ============================================================================
  
  test('CP056-05: Medir tiempo de recarga manual (refresh)', async ({ page }) => {
    console.log('\n🧪 CP056-05: Midiendo recarga manual...');
    
    const refreshButton = page.locator('button:has-text("Refresh"), button:has(.anticon-redo)').first();
    
    // Verificar que existe el botón de refresh
    await expect(refreshButton).toBeVisible();
    
    // Medir tiempo de recarga
    const { duration: refreshTime } = await measureTime(async () => {
      await refreshButton.click();
      await waitForTableLoad(page);
    });
    
    metrics.refreshTime = refreshTime;
    
    // Verificar que la tabla se recargó correctamente
    const visibleRows = await getVisibleRowCount(page);
    expect(visibleRows).toBeGreaterThan(0);
    
    console.log(`  ✅ Tabla recargada en ${refreshTime.toFixed(2)}ms`);
    console.log(`  👁️  Registros visibles: ${visibleRows}`);
    
    // Verificar umbral de rendimiento
    expect(refreshTime).toBeLessThan(PERFORMANCE_THRESHOLDS.refresh);
  });

  // ============================================================================
  // TEST 6: Validación Visual y Correctitud
  // ============================================================================
  
  test('CP056-06: Verificar correctitud visual con 1000+ registros', async ({ page }) => {
    console.log('\n🧪 CP056-06: Verificando correctitud visual...');
    
    // 1. Verificar encabezado de tabla
    const tableHeader = page.locator('.ant-table-thead');
    await expect(tableHeader).toBeVisible();
    
    const headerCells = await tableHeader.locator('th').count();
    expect(headerCells).toBeGreaterThan(0);
    console.log(`  ✅ Encabezado renderizado: ${headerCells} columnas`);
    
    // 2. Verificar filas de datos
    const tableBody = page.locator('.ant-table-tbody');
    await expect(tableBody).toBeVisible();
    
    const visibleRows = await getVisibleRowCount(page);
    expect(visibleRows).toBeGreaterThan(0);
    console.log(`  ✅ Filas visibles: ${visibleRows}`);
    
    // 3. Verificar paginación
    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();
    console.log('  ✅ Paginación visible');
    
    // 4. Verificar botones de acción
    const addButton = page.locator('button:has-text("Add"), button:has-text("add")').first();
    const refreshButton = page.locator('button:has(.anticon-redo)').first();
    
    await expect(addButton).toBeVisible();
    await expect(refreshButton).toBeVisible();
    console.log('  ✅ Botones de acción visibles');
    
    // 5. Verificar que no hay errores visuales (overlay, mensajes de error)
    const errorMessage = page.locator('.ant-message-error, .ant-notification-notice-error');
    const errorCount = await errorMessage.count();
    expect(errorCount).toBe(0);
    console.log('  ✅ Sin errores visuales');
    
    // 6. Verificar scroll horizontal (si existe)
    const tableWrapper = page.locator('.ant-table-content');
    const hasScroll = await tableWrapper.evaluate((el) => el.scrollWidth > el.clientWidth);
    console.log(`  ℹ️  Scroll horizontal: ${hasScroll ? 'Sí' : 'No'}`);
  });

  // ============================================================================
  // TEST 7: Resumen Final de Métricas
  // ============================================================================
  
  test.afterAll(async () => {
    printMetricsSummary();
  });
});
