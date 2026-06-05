export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD"
  }).format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function nextDocumentNumber(prefix: string) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${suffix}`;
}
