export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split('.');
  const whole = parts[0] ?? '0';
  const decimal = parts[1] ?? '00';
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}$${withCommas}.${decimal}`;
}

