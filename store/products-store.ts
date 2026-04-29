import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
} from '@/db/products';
import type { CreateProductInput, Product, UpdateProductInput } from '@/types';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  lastCreatedId: number | null;
  fetchProducts: () => Promise<void>;
  addProduct: (data: CreateProductInput) => Promise<void>;
  updateProduct: (id: number, data: UpdateProductInput) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  clearLastCreatedId: () => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  isLoading: false,
  error: null,
  lastCreatedId: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const products = await getAllProducts(db);
      set({ products, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  addProduct: async (data) => {
    const db = await getDatabase();
    const id = await createProduct(db, data);
    const products = await getAllProducts(db);
    set({ products, lastCreatedId: id });
  },

  clearLastCreatedId: () => set({ lastCreatedId: null }),

  updateProduct: async (id, data) => {
    const db = await getDatabase();
    await updateProduct(db, id, data);
    const products = await getAllProducts(db);
    set({ products });
  },

  deleteProduct: async (id) => {
    const db = await getDatabase();
    await softDeleteProduct(db, id);
    const products = await getAllProducts(db);
    set({ products });
  },
}));
