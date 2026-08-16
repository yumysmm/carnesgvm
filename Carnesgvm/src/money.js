export function money(n) {
  return "$" + Math.round(n || 0).toLocaleString("es-CO");
}
