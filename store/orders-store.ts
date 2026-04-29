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
import { getLabelsByOrderId, setOrderLabels } from '@/db/labels';
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  DeliveryStatus,
  Label,
  Order,
  OrderItem,
  PaymentStatus,
  UpdateOrderInput,
} from '@/types';

interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  selectedOrderItems: OrderItem[];
  selectedOrderLabels: Label[];
  isLoading: boolean;
  error: string | null;
  lastCreatedId: number | null;
  fetchTodaysOrders: () => Promise<void>;
  fetchOrdersByRange: (from: string, to: string) => Promise<void>;
  fetchOrderById: (id: number) => Promise<void>;
  createOrder: (
    data: CreateOrderInput,
    items: Omit<CreateOrderItemInput, 'order_id'>[],
    labelIds?: number[]
  ) => Promise<number>;
  updateOrder: (
    id: number,
    data: UpdateOrderInput,
    items: Omit<CreateOrderItemInput, 'order_id'>[],
    labelIds?: number[]
  ) => Promise<void>;
  updateOrderStatus: (
    id: number,
    field: 'delivery_status' | 'payment_status',
    value: DeliveryStatus | PaymentStatus
  ) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  lastCreatedId: number | null;
  clearLastCreatedId: () => void;
  clearSelected: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  selectedOrderItems: [],
  selectedOrderLabels: [],
  isLoading: false,
  error: null,
  lastCreatedId: null,

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
      const [order, items, labels] = await Promise.all([
        getOrderById(db, id),
        getItemsByOrderId(db, id),
        getLabelsByOrderId(db, id),
      ]);
      set({ selectedOrder: order, selectedOrderItems: items, selectedOrderLabels: labels, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createOrder: async (data, items, labelIds = []) => {
    const db = await getDatabase();
    const id = await createOrder(db, data, items);
    if (labelIds.length > 0) await setOrderLabels(db, id, labelIds);
    const orders = await getTodaysOrders(db);
    set({ orders, lastCreatedId: id });
    return id;
  },

  updateOrder: async (id, data, items, labelIds) => {
    const db = await getDatabase();
    await updateOrder(db, id, data, items);
    if (labelIds !== undefined) await setOrderLabels(db, id, labelIds);
    const [order, orderItems, orderLabels, orders] = await Promise.all([
      getOrderById(db, id),
      getItemsByOrderId(db, id),
      getLabelsByOrderId(db, id),
      getTodaysOrders(db),
    ]);
    set({ selectedOrder: order, selectedOrderItems: orderItems, selectedOrderLabels: orderLabels, orders });
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

  clearLastCreatedId: () => set({ lastCreatedId: null }),
  clearSelected: () => set({ selectedOrder: null, selectedOrderItems: [], selectedOrderLabels: [] }),
}));
