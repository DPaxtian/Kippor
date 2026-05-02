// ─── Productos ────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  image_uri: string | null;
  emoji: string | null;
  is_active: number; // 0 | 1
  created_at: string; // ISO 8601
}

export type CreateProductInput = Omit<Product, 'id' | 'is_active' | 'created_at'>;
export type UpdateProductInput = Partial<Omit<Product, 'id' | 'created_at'>>;

// ─── Items de pedido ──────────────────────────────────────────────────────────

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export type CreateOrderItemInput = Omit<OrderItem, 'id'>;

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'delivered';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Order {
  id: number;
  client_name: string;
  client_address: string | null;
  has_delivery: number; // 0 | 1
  shipping_cost: number;
  delivery_status: DeliveryStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  subtotal: number;
  total: number;
  delivery_date: string | null;    // ISO 8601, fecha programada de entrega
  advance_payment: number;         // adelanto recibido, default 0
  created_at: string; // ISO 8601
}

export type CreateOrderInput = Omit<Order, 'id' | 'subtotal' | 'total' | 'created_at'>;
export type UpdateOrderInput = Partial<Omit<Order, 'id' | 'created_at'>>;

// ─── Etiquetas ────────────────────────────────────────────────────────────────

export interface Label {
  id: number;
  name: string;
  color: string; // hex, ej. '#E97864'
  created_at: string; // ISO 8601
}

export type CreateLabelInput = Pick<Label, 'name' | 'color'>;
export type UpdateLabelInput = Partial<Pick<Label, 'name' | 'color'>>;

// ─── Reportes ─────────────────────────────────────────────────────────────────

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  paidCount: number;
  unpaidCount: number;
  pendingDeliveries: number;
  totalAdvancePayments: number; // suma de adelantos recibidos en el período
  pendingBalance: number;       // saldo pendiente de cobrar (unpaid total - adelantos)
  cashRevenue: number;
  cardRevenue: number;
  transferRevenue: number;
}

export interface ProductStat {
  product_name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

// ─── Gastos ───────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'supplies'
  | 'packaging'
  | 'transport'
  | 'equipment'
  | 'services'
  | 'marketing'
  | 'fees'
  | 'other';

export interface Expense {
  id: number;
  amount: number;
  category: ExpenseCategory;
  date: string;        // ISO 8601 — fecha del gasto (no del registro)
  notes: string | null;
  created_at: string;  // ISO 8601
  labels?: Label[];
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'created_at' | 'labels'> & { labelIds?: number[] };
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'created_at' | 'labels'>> & { labelIds?: number[] };

export interface ExpenseCategoryStat {
  category: ExpenseCategory;
  total: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: ExpenseCategoryStat[];
}
