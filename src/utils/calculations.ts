/**
 * Calculate profit per piece.
 */
export function calculateProfitPerPiece(purchasePrice: number, sellingPrice: number): number {
  return sellingPrice - purchasePrice;
}

/**
 * Calculate profit margin (profit / selling price × 100).
 */
export function calculateMargin(purchasePrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  const profit = sellingPrice - purchasePrice;
  return (profit / sellingPrice) * 100;
}

/**
 * Calculate markup (profit / purchase price × 100).
 */
export function calculateMarkup(purchasePrice: number, sellingPrice: number): number {
  if (purchasePrice === 0) return 0;
  const profit = sellingPrice - purchasePrice;
  return (profit / purchasePrice) * 100;
}

/**
 * Calculate total revenue.
 */
export function calculateRevenue(sellingPrice: number, quantity: number): number {
  return sellingPrice * quantity;
}

/**
 * Calculate total cost.
 */
export function calculateCost(purchasePrice: number, quantity: number): number {
  return purchasePrice * quantity;
}

/**
 * Calculate total profit.
 */
export function calculateTotalProfit(
  purchasePrice: number,
  sellingPrice: number,
  quantity: number
): number {
  return (sellingPrice - purchasePrice) * quantity;
}

/**
 * Calculate recommended selling price from purchase price and target margin.
 * Formula: Selling Price = Purchase Price / (1 - Target Margin)
 */
export function calculateSellingPriceFromMargin(
  purchasePrice: number,
  targetMargin: number
): number {
  if (targetMargin >= 100 || targetMargin < 0) return 0;
  return purchasePrice / (1 - targetMargin / 100);
}

/**
 * Calculate recommended selling price from purchase price and target profit.
 */
export function calculateSellingPriceFromProfit(
  purchasePrice: number,
  targetProfit: number
): number {
  return purchasePrice + targetProfit;
}

/**
 * Calculate units needed to reach target profit.
 */
export function calculateTargetUnits(targetProfit: number, profitPerPiece: number): number {
  if (profitPerPiece <= 0) return 0;
  return Math.ceil(targetProfit / profitPerPiece);
}

/**
 * Generate price scenarios for comparison.
 */
export function generatePriceScenarios(
  purchasePrice: number,
  sellingPrices: number[],
  quantity: number
) {
  return sellingPrices.map((sellingPrice) => ({
    selling_price: sellingPrice,
    profit_per_piece: calculateProfitPerPiece(purchasePrice, sellingPrice),
    total_profit: calculateTotalProfit(purchasePrice, sellingPrice, quantity),
    margin: calculateMargin(purchasePrice, sellingPrice),
  }));
}

/**
 * Format margin as percentage string.
 */
export function formatMargin(margin: number): string {
  return `${margin.toFixed(2)}%`;
}
