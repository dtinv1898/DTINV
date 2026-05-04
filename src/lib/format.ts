export function fmtNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const n = Number(value);
  // Show decimals only when needed: use up to `decimals` fraction digits, but don't force trailing zeros
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function fmtPercentNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const n = Number(value);
  // Value is expected to already be a percentage (e.g., 50 for 50%)
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return `${formatted}%`;
}

export function fmtCurrency(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const n = Number(value);
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return `₱${formatted}`;
}
