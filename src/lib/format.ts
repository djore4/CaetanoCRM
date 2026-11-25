const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export const money = (n: number) => eur.format(n);

export const monthKey = (iso: string) => iso.slice(0, 7); // yyyy-mm

export function monthLabel(key: string, long = true) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-PT", {
    month: long ? "long" : "short",
    year: long ? "numeric" : undefined,
  });
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const currentMonth = () => new Date().toISOString().slice(0, 7);

export const dayLabel = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
  });

export const round2 = (n: number) => Math.round(n * 100) / 100;
