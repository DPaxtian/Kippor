import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  DeliveryStatus,
  Order,
  PaymentStatus,
  UpdateOrderInput,
} from '@/types';
import { createOrderItem, deleteItemsByOrderId } from './order-items';

export interface OrderFilters {
  from?: string;    // ISO 8601
  to?: string;      // ISO 8601
  labelId?: number; // filtrar por etiqueta
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getOrders(
  db: SQLiteDatabase,
  filters?: OrderFilters
): Promise<Order[]> {
  const hasRange = filters?.from && filters?.to;
  const hasLabel = filters?.labelId !== undefined;

  if (hasLabel) {
    const params: (string | number)[] = [filters!.labelId!];
    let sql = `SELECT o.* FROM orders o
               INNER JOIN order_labels ol ON ol.order_id = o.id
               WHERE ol.label_id = ?`;
    if (hasRange) {
      sql += ` AND o.created_at >= ? AND o.created_at <= ?`;
      params.push(filters!.from!, filters!.to!);
    }
    sql += ` ORDER BY o.created_at DESC`;
    return db.getAllAsync<Order>(sql, params);
  }

  if (hasRange) {
    return db.getAllAsync<Order>(
      `SELECT * FROM orders
       WHERE created_at >= ? AND created_at <= ?
       ORDER BY created_at DESC`,
      [filters!.from!, filters!.to!]
    );
  }

  return db.getAllAsync<Order>('SELECT * FROM orders ORDER BY created_at DESC');
}

export async function getTodaysOrders(db: SQLiteDatabase): Promise<Order[]> {
  const today = new Date();
  const from = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const to = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  return getOrders(db, { from, to });
}

export async function getOrderById(
  db: SQLiteDatabase,
  id: number
): Promise<Order | null> {
  return db.getFirstAsync<Order>('SELECT * FROM orders WHERE id = ?', [id]);
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export async function createOrder(
  db: SQLiteDatabase,
  orderData: CreateOrderInput,
  items: Omit<CreateOrderItemInput, 'order_id'>[]
): Promise<number> {
  let orderId = 0;

  await db.withTransactionAsync(async () => {
    // Calcular totales
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const total = subtotal + (orderData.has_delivery ? orderData.shipping_cost : 0);

    const result = await db.runAsync(
      `INSERT INTO orders
         (client_name, client_address, has_delivery, shipping_cost,
          delivery_status, payment_status, payment_method, notes,
          subtotal, total, delivery_date, advance_payment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.client_name,
        orderData.client_address ?? null,
        orderData.has_delivery,
        orderData.shipping_cost,
        orderData.delivery_status,
        orderData.payment_status,
        orderData.payment_method,
        orderData.notes ?? null,
        subtotal,
        total,
        orderData.delivery_date ?? null,
        orderData.advance_payment ?? 0,
        new Date().toISOString(),
      ]
    );

    orderId = result.lastInsertRowId;

    // Insertar items con el orderId correcto
    for (const item of items) {
      await createOrderItem(db, { ...item, order_id: orderId });
    }
  });

  return orderId;
}

export async function updateOrder(
  db: SQLiteDatabase,
  id: number,
  orderData: UpdateOrderInput,
  items: Omit<CreateOrderItemInput, 'order_id'>[]
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const total =
      subtotal + (orderData.has_delivery ? (orderData.shipping_cost ?? 0) : 0);

    await db.runAsync(
      `UPDATE orders
       SET client_name      = COALESCE(?, client_name),
           client_address   = ?,
           has_delivery     = COALESCE(?, has_delivery),
           shipping_cost    = COALESCE(?, shipping_cost),
           delivery_status  = COALESCE(?, delivery_status),
           payment_status   = COALESCE(?, payment_status),
           payment_method   = COALESCE(?, payment_method),
           notes            = ?,
           subtotal         = ?,
           total            = ?,
           delivery_date    = ?,
           advance_payment  = COALESCE(?, advance_payment)
       WHERE id = ?`,
      [
        orderData.client_name ?? null,
        orderData.client_address !== undefined ? orderData.client_address : null,
        orderData.has_delivery ?? null,
        orderData.shipping_cost ?? null,
        orderData.delivery_status ?? null,
        orderData.payment_status ?? null,
        orderData.payment_method ?? null,
        orderData.notes !== undefined ? orderData.notes : null,
        subtotal,
        total,
        orderData.delivery_date !== undefined ? orderData.delivery_date : null,
        orderData.advance_payment ?? null,
        id,
      ]
    );

    // Reemplazar items: eliminar y reinsertar
    await deleteItemsByOrderId(db, id);
    for (const item of items) {
      await createOrderItem(db, { ...item, order_id: id });
    }
  });
}

export async function updateOrderStatus(
  db: SQLiteDatabase,
  id: number,
  field: 'delivery_status' | 'payment_status',
  value: DeliveryStatus | PaymentStatus
): Promise<void> {
  await db.runAsync(`UPDATE orders SET ${field} = ? WHERE id = ?`, [value, id]);
}

export async function deleteOrder(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  // ON DELETE CASCADE se encarga de los order_items
  await db.runAsync('DELETE FROM orders WHERE id = ?', [id]);
}
