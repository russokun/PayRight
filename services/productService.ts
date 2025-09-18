import { mockProducts } from '@/mocks/products';
import { Product } from '@/types';

// Obtener todos los productos
export function getProducts(): Product[] {
  return mockProducts;
}

// Obtener historial de precios de un producto por id
export function getPricesByProduct(productId: string) {
  const product = mockProducts.find((p) => p.id === productId);
  return product ? product.prices : [];
}

// Agregar un reporte de precio (solo mock, modifica el array en runtime)
export function addPriceReport(productId: string, priceReport: any) {
  const product = mockProducts.find((p) => p.id === productId);
  if (product) {
    product.prices.unshift(priceReport);
    return true;
  }
  return false;
}
