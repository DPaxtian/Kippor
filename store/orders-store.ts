import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import {
  getOrders,
  getTodaysOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  type OrderFilters,
} from '@/db/orders';
import { getItemsByOrderId } from '@/db/order-items';
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  DeliveryStatus,
  Order,
  OrderItem,
  PaymentStatus,
  UpdateOrderInput,
} from '@/types';

interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  selectedOrderItems: OrderItem[];
  isLoading: boolean;
  error: string | null;
  fetchTodaysOrders: () => Promise<void>;
  fetchOrdersByRange: (from: string, to: string) => Promise<void>;
  fetchOrderById: (id: number) => Promise<void>;
  createOrder: (
    data: CreateOrderInput,
    items: Omit<CreateOrderItemInput, 'order_id'>[]
  ) => Promise<number>;
  updateOrder: (
    id: number,
    data: UpdateOrderInput,
    items: Omit<CreateOrderItemInput, 'order_id'>[]
  ) => Promise<void>;
  updateOrderStatus: (
    id: number,
    field: 'delivery_status' | 'payment_status',
    value: DeliveryStatus | PaymentStatus
  ) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  clearSelected: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  selectedOrderItems: [],
  isLoading: false,
  error: null,

  fetchTodaysOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const orders = await getTodaysOrders(db);
      set({ orders, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  fetchOrdersByRange: async (from, to) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const filters: OrderFilters = { from, to };
      const orders = await getOrders(db, filters);
      set({ orders, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const [order, items] = await Promise.all([
        getOrderById(db, id),
        getItemsByOrderId(db, id),
      ]);
      set({ selectedOrder: order, selectedOrderItems: items, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createOrder: async (data, items) => {
    const db = await getDatabase();
    const id = await createOrder(db, data, items);
    // Refrescar lista de hoy
    const orders = await getTodaysOrders(db);
    set({ orders });
    return id;
  },

  updateOrder: async (id, data, items) => {
    const db = await getDatabase();
    await updateOrder(db, id, data, items);
    // Refrescar pedido seleccionado y lista
    const [order, orderItems, orders] = await Promise.all([
      getOrderById(db, id),
      getItemsByOrderId(db, id),
      getTodaysOrders(db),
    ]);
    set({ selectedOrder: order, selectedOrderItems: orderItems, orders });
  },

  updateOrderStatus: async (id, field, value) => {
    const db = await getDatabase();
    await updateOrderStatus(db, id, field, value);
    // Actualizar inline en la lista sin re-fetch completo
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
      selectedOrder:
        state.selectedOrder?.id === id
          ? { ...state.selectedOrder, [field]: value }
          : state.selectedOrder,
    }));
  },

  deleteOrder: async (id) => {
    const db = await getDatabase();
    await deleteOrder(db, id);
    const orders = await getTodaysOrders(db);
    set({ orders, selectedOrder: null, selectedOrderItems: [] });
  },

  clearSelected: () => set({ selectedOrder: null, selectedOrderItems: [] }),
}));
