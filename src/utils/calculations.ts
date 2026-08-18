import type { Product, TierPricing, BundleItem } from "@/types";

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

/**
 * Calculate metrics for a Multi-Product Combo Bundle.
 */
export function calculateBundleMetrics(
  items: (BundleItem | { purchase_price: number; selling_price: number; quantity: number })[],
  bundleSellingPrice: number
) {
  const totalCost = items.reduce((acc, it) => acc + (Number(it.purchase_price) || 0) * (Number(it.quantity) || 1), 0);
  const totalNormalPrice = items.reduce((acc, it) => acc + (Number(it.selling_price) || 0) * (Number(it.quantity) || 1), 0);
  const bundleProfit = bundleSellingPrice - totalCost;
  const discountAmount = Math.max(0, totalNormalPrice - bundleSellingPrice);
  const discountPercent = totalNormalPrice > 0 ? (discountAmount / totalNormalPrice) * 100 : 0;
  const margin = bundleSellingPrice > 0 ? (bundleProfit / bundleSellingPrice) * 100 : 0;

  return {
    totalCost,
    totalNormalPrice,
    bundleProfit,
    discountAmount,
    discountPercent,
    margin,
  };
}

/**
 * Get effective total revenue, cost, profit, and applied tier for a single product based on quantity.
 */
export function getEffectivePricingForQuantity(
  product: Product,
  qty: number
): {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  appliedTier: TierPricing | null;
  discountSavings: number;
  effectiveUnitPrice: number;
} {
  const normalUnitPrice = product.selling_price || 0;
  const normalUnitCost = product.purchase_price || 0;
  const totalCost = normalUnitCost * qty;

  if (!product.tier_pricing || product.tier_pricing.length === 0 || qty <= 0) {
    const totalRevenue = normalUnitPrice * qty;
    return {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      appliedTier: null,
      discountSavings: 0,
      effectiveUnitPrice: normalUnitPrice,
    };
  }

  // Sort tiers descending by min_qty
  const sortedTiers = [...product.tier_pricing].sort((a, b) => b.min_qty - a.min_qty);

  // Check if an exact or applicable tier matches
  let bestTier: TierPricing | null = null;
  for (const tier of sortedTiers) {
    if (qty >= tier.min_qty) {
      bestTier = tier;
      break;
    }
  }

  if (bestTier) {
    // If exact bundle match (e.g. qty 2 on a 2-pcs tier of 10000):
    // Or multiples: e.g. 4 pcs with 2-pcs tier => 2 * 10000 = 20000
    const bundleSets = Math.floor(qty / bestTier.min_qty);
    const remainder = qty % bestTier.min_qty;
    const totalRevenue = bundleSets * bestTier.price + remainder * normalUnitPrice;
    const normalTotalRevenue = normalUnitPrice * qty;
    const discountSavings = Math.max(0, normalTotalRevenue - totalRevenue);

    return {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      appliedTier: bestTier,
      discountSavings,
      effectiveUnitPrice: totalRevenue / qty,
    };
  }

  const totalRevenue = normalUnitPrice * qty;
  return {
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    appliedTier: null,
    discountSavings: 0,
    effectiveUnitPrice: normalUnitPrice,
  };
}
