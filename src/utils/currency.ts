/**
 * Format a number as Indonesian Rupiah currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with dot separators (Indonesian style).
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Parse a formatted currency string back to a number.
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d-]/g, "");
  return parseInt(cleaned, 10) || 0;
}
