/** Un código de barras sin sus ceros iniciales: el UPC-A "735051016372" y el EAN-13 "0735051016372" son un solo producto. */
export function gtinKey(gtin: string): string {
  return gtin.replace(/^0+/, '');
}

/** EAN-8, UPC-A, EAN-13 o GTIN-14 con dígito verificador correcto: una mala lectura de la cámara casi nunca lo pasa. */
export function gtinValid(code: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop()!;
  // desde la derecha, el dígito junto al verificador pesa 3, el siguiente 1, y así
  const sum = digits
    .reverse()
    .reduce((total, d, i) => total + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
