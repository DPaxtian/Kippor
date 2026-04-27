import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateOrderItemInput, OrderItem } from '@/types';

export async function getItemsByOrderId(
  db: SQLiteDatabase,
  orderId: number
): Promise<OrderItem[]> {
  return db.getAllAsync<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orderId]
  );
}

export async function createOrderItem(
  db: SQLiteDatabase,
  data: CreateOrderItemInput
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO order_items
       (order_id, product_id, product_name, product_price, quantity, subtotal)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.order_id,
      data.product_id ?? null,
      data.product_name,
      data.product_price,
      data.quantity,
      data.subtotal,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteItemsByOrderId(
  db: SQLiteDatabase,
  orderId: number
): Promise<void> {
  await db.runAsync('DELETE FROM order_items WHERE order_id = ?', [orderId]);
}
