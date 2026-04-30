import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ProductStat, SalesSummary } from '@/types';

function labelJoin(labelIds?: number[]): { join: string; cond: string; param: number[] } {
  if (!labelIds || labelIds.length === 0) return { join: '', cond: '', param: [] };
  const placeholders = labelIds.map(() => '?').join(', ');
  return {
    join: 'INNER JOIN order_labels _ol ON _ol.order_id = o.id',
    cond: `AND _ol.label_id IN (${placeholders})`,
    param: labelIds,
  };
}

export async function getSalesSummary(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[]
): Promise<SalesSummary> {
  const { join, cond, param } = labelJoin(labelIds);
  const row = await db.getFirstAsync<{
    totalOrders: number;
    totalRevenue: number | null;
    avgOrderValue: number | null;
    paidCount: number;
    unpaidCount: number;
    pendingDeliveries: number;
    totalAdvancePayments: number | null;
    pendingBalance: number | null;
  }>(
    `SELECT
       COUNT(*)                                                                                           AS totalOrders,
       SUM(o.subtotal)                                                                                    AS totalRevenue,
       AVG(o.subtotal)                                                                                    AS avgOrderValue,
       SUM(CASE WHEN o.payment_status  = 'paid'    THEN 1 ELSE 0 END)                                    AS paidCount,
       SUM(CASE WHEN o.payment_status  = 'unpaid'  THEN 1 ELSE 0 END)                                    AS unpaidCount,
       SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END)                                    AS pendingDeliveries,
       SUM(o.advance_payment)                                                                             AS totalAdvancePayments,
       SUM(CASE WHEN o.payment_status = 'unpaid' THEN o.subtotal - o.advance_payment ELSE 0 END)         AS pendingBalance
     FROM orders o ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${cond}`,
    [from, to, ...param]
  );

  return {
    totalOrders: row?.totalOrders ?? 0,
    totalRevenue: row?.totalRevenue ?? 0,
    avgOrderValue: row?.avgOrderValue ?? 0,
    paidCount: row?.paidCount ?? 0,
    unpaidCount: row?.unpaidCount ?? 0,
    pendingDeliveries: row?.pendingDeliveries ?? 0,
    totalAdvancePayments: row?.totalAdvancePayments ?? 0,
    pendingBalance: row?.pendingBalance ?? 0,
  };
}

export async function getPreviousPeriodRevenue(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[]
): Promise<number> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const spanMs = toDate.getTime() - fromDate.getTime();

  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - spanMs);

  const { join, cond, param } = labelJoin(labelIds);
  const row = await db.getFirstAsync<{ rev: number | null }>(
    `SELECT SUM(o.subtotal) AS rev FROM orders o ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${cond}`,
    [prevFrom.toISOString(), prevTo.toISOString(), ...param]
  );
  return row?.rev ?? 0;
}

export async function getWeeklyRevenue(
  db: SQLiteDatabase,
  anchorDate: Date = new Date(),
  labelIds?: number[]
): Promise<number[]> {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(anchorDate, i), 'yyyy-MM-dd'));
  }

  const from = startOfDay(subDays(anchorDate, 6)).toISOString();
  const to = endOfDay(anchorDate).toISOString();

  const { join, cond, param } = labelJoin(labelIds);
  const rows = await db.getAllAsync<{ day: string; rev: number }>(
    `SELECT date(o.created_at) AS day, SUM(o.subtotal) AS rev
     FROM orders o ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${cond}
     GROUP BY day`,
    [from, to, ...param]
  );

  const map: Record<string, number> = {};
  rows.forEach((r) => { map[r.day] = r.rev; });
  return days.map((d) => map[d] ?? 0);
}

export async function getTopProducts(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[]
): Promise<ProductStat[]> {
  const { join, cond, param } = labelJoin(labelIds);
  return db.getAllAsync<ProductStat>(
    `SELECT
       oi.product_name,
       SUM(oi.quantity) AS totalQuantity,
       SUM(oi.subtotal) AS totalRevenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${cond}
     GROUP BY oi.product_name
     ORDER BY totalRevenue DESC
     LIMIT 10`,
    [from, to, ...param]
  );
}
