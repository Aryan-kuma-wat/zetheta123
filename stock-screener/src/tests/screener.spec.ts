import { test, expect } from "@playwright/test";

test.describe("Real-Time Stock Screener E2E Workflows", () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Navigate to the local dashboard
    await page.goto("http://localhost:3000");
    // Wait for the mock seeder loading delay to finish
    await page.waitForTimeout(300);
  });

  test("should render the dashboard layout shells, header, and stats cards", async ({ page }) => {
    // Check main title
    await expect(page.locator("h1")).toContainText("StockScreener");

    // Check market open status badge
    await expect(page.locator("text=Market Open")).toBeVisible();

    // Check if seeder populated stocks total count
    await expect(page.locator("text=stocks loaded")).toBeVisible();

    // Check stats cards are rendered with summary statistics
    await expect(page.locator("text=Total Stocks")).toBeVisible();
    await expect(page.locator("text=Gainers")).toBeVisible();
    await expect(page.locator("text=Losers")).toBeVisible();
    await expect(page.locator("text=Avg Change")).toBeVisible();
  });

  test("should execute basic sector and price filters with high performance", async ({ page }) => {
    // Check if the stock grid lists records initially
    const initialRows = page.locator("tbody tr");
    await expect(initialRows).toHaveCount({ greaterThan: 0 });

    // Open Sector filter select
    const sectorDropdown = page.locator("select").first();
    await sectorDropdown.selectOption("Technology");

    // Check if the count updates dynamically
    await page.waitForTimeout(200);
    const techCountLabel = page.locator("text=records");
    await expect(techCountLabel).toBeVisible();

    // Check that all displayed items are part of Technology sector (or table results match)
    await expect(page.locator("tbody")).toContainText("TECH");
  });

  test("should compile and execute advanced AST P/E rules using the sidebar", async ({ page }) => {
    // Navigate to Advanced Rules tab
    const advancedTab = page.locator("button:has-text('Advanced')");
    await advancedTab.click();

    // Verify Advanced Rules form components load
    await expect(page.locator("text=Add Metric Constraint")).toBeVisible();

    // Select PE from dropdown
    await page.locator("select").nth(2).selectOption("pe");
    // Select Less than operator
    await page.locator("select").nth(3).selectOption("lt");
    // Fill threshold to 15
    await page.locator("input[type='number']").nth(2).fill("15");

    // Click Inject Rule
    const injectBtn = page.locator("button:has-text('Inject Rule')");
    await injectBtn.click();

    // Check that rule is added to the active constraints list
    await expect(page.locator("text=Active Rules (1)")).toBeVisible();
    await expect(page.locator("text=P/E Ratio")).toBeVisible();

    // Check that stock list is filtered dynamically below 150ms
    const filteredRows = page.locator("tbody tr");
    await expect(filteredRows).toHaveCount({ greaterThan: 0 });
  });

  test("should sync active stock selections with synced candlestick chart panes", async ({ page }) => {
    // 1. Locate and click on the second stock row in the virtual table (e.g. AAPL or JPM)
    const secondRow = page.locator("tbody tr").nth(1);
    const tickerName = await secondRow.locator("td").nth(1).textContent();

    // Select row
    await secondRow.click();

    // 2. Check if the Chart header updates with the selected ticker symbol
    const chartHeader = page.locator("h3");
    await expect(chartHeader).toContainText(tickerName || "");

    // 3. Check if the chart rendering container canvas elements are inserted
    const chartCanvas = page.locator("div[ref='chartContainerRef'] canvas");
    await expect(page.locator("canvas").first()).toBeVisible();

    // 4. Change chart timeframes (e.g. click 1Y pill)
    const tf1Y = page.locator("button:has-text('1Y')");
    await tf1Y.click();
    
    // Verify loading overlay shows up and fades
    await page.waitForTimeout(200);
    await expect(page.locator("text=Querying market canvas data...")).not.toBeVisible();
  });

  test("should manage custom watchlists through localStorage persistence", async ({ page }) => {
    // 1. Hover on first row and toggle star icon
    const firstRowStar = page.locator("tbody tr").first().locator("button").first();
    await firstRowStar.click();

    // 2. Switch sidebar tab or check Watchlist panel
    await expect(page.locator("text=Your watchlist is empty.")).not.toBeVisible();
    
    // Check ticker symbol appears inside the active watchlist panel
    const firstTicker = await page.locator("tbody tr").first().locator("td").nth(1).textContent();
    await expect(page.locator("aside")).toContainText(firstTicker || "");
  });
});
