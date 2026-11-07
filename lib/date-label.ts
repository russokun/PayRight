/** "05 nov" — fecha corta en español de Chile. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }).replace(".", "");
}
