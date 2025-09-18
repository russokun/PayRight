import { create } from 'zustand';
import { Product, PriceReport } from '@/types';
import { mockProducts } from '@/mocks/products';

interface ProductStore {
  products: Product[];
  getProductById: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];
  addPriceReport: (report: PriceReport) => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: mockProducts,

  getProductById: (id: string) => {
    const { products } = get();
    return products.find(product => product.id === id);
  },

  searchProducts: (query: string) => {
    const { products } = get();
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery)
    );
  },

  addPriceReport: (report: PriceReport) => {
    set((state) => {
      const existingProduct = state.products.find(
        p => p.name.toLowerCase() === report.productName.toLowerCase()
      );

      if (existingProduct) {
        // Agregar precio a producto existente
        const newPrice = {
          supermarket: report.supermarket,
          price: report.price,
          location: report.location,
          date: new Date().toLocaleDateString('es-CL'),
          verified: false,
        };

        return {
          products: state.products.map(product =>
            product.id === existingProduct.id
              ? { ...product, prices: [...product.prices, newPrice] }
              : product
          ),
        };
      } else {
        // Crear nuevo producto
        const newProduct: Product = {
          id: Date.now().toString(),
          name: report.productName,
          category: 'Otros',
          prices: [
            {
              supermarket: report.supermarket,
              price: report.price,
              location: report.location,
              date: new Date().toLocaleDateString('es-CL'),
              verified: false,
            },
          ],
        };

        return {
          products: [...state.products, newProduct],
        };
      }
    });
  },
}));