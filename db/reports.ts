import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ProductStat, SalesSummary, ExpenseSummary } from '@/types';
import { getExpenseSummary } from './expenses';

function labelJoin(labelIds?: number[]): { join: string; cond: string; param: (string | number)[] } {
  if (!labelIds || labelIds.length === 0) return { join: '', cond: '', param: [] };
  const placeholders = labelIds.map(() => '?').join(', ');
  return {
    join: 'INNER JOIN order_labels _ol ON _ol.order_id = o.id',
    cond: `AND _ol.label_id IN (${placeholders})`,
    param: labelIds,
  };
}

function methodCond(paymentMethods?: string[]): { cond: string; param: string[] } {
  if (!paymentMethods || paymentMethods.length === 0) return { cond: '', param: [] };
  const placeholders = paymentMethods.map(() => '?').join(', ');
  return { cond: `AND o.payment_method IN (${placeholders})`, param: paymentMethods };
}

export async function getSalesSummary(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[],
  paymentMethods?: string[]
): Promise<SalesSummary> {
  const { join, cond: lCond, param: lParam } = labelJoin(labelIds);
  const { cond: mCond, param: mParam } = methodCond(paymentMethods);
  const row = await db.getFirstAsync<{
    totalOrders: number;
    totalRevenue: number | null;
    avgOrderValue: number | null;
    paidCount: number;
    unpaidCount: number;
    pendingDeliveries: number;
    totalAdvancePayments: number | null;
    pendingBalance: number | null;
    cashRevenue: number | null;
    cardRevenue: number | null;
    transferRevenue: number | null;
  }>(
    `SELECT
       COUNT(*)                                                                                           AS totalOrders,
       SUM(o.subtotal)                                                                                    AS totalRevenue,
       AVG(o.subtotal)                                                                                    AS avgOrderValue,
       SUM(CASE WHEN o.payment_status  = 'paid'    THEN 1 ELSE 0 END)                                    AS paidCount,
       SUM(CASE WHEN o.payment_status  = 'unpaid'  THEN 1 ELSE 0 END)                                    AS unpaidCount,
       SUM(CASE WHEN o.delivery_status = 'pending' THEN 1 ELSE 0 END)                                    AS pendingDeliveries,
       SUM(o.advance_payment)                                                                             AS totalAdvancePayments,
       SUM(CASE WHEN o.payment_status = 'unpaid' THEN o.subtotal - o.advance_payment ELSE 0 END)         AS pendingBalance,
       SUM(CASE WHEN o.payment_method = 'cash'     THEN o.subtotal ELSE 0 END)                           AS cashRevenue,
       SUM(CASE WHEN o.payment_method = 'card'     THEN o.subtotal ELSE 0 END)                           AS cardRevenue,
       SUM(CASE WHEN o.payment_method = 'transfer' THEN o.subtotal ELSE 0 END)                           AS transferRevenue
     FROM orders o ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${lCond} ${mCond}`,
    [from, to, ...lParam, ...mParam]
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
    cashRevenue: row?.cashRevenue ?? 0,
    cardRevenue: row?.cardRevenue ?? 0,
    transferRevenue: row?.transferRevenue ?? 0,
  };
}

export async function getPreviousPeriodRevenue(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[],
  paymentMethods?: string[]
): Promise<number> {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const spanMs = toDate.getTime() - fromDate.getTime();

  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - spanMs);

  const { join, cond: lCond, param: lParam } = labelJoin(labelIds);
  const { cond: mCond, param: mParam } = methodCond(paymentMethods);
  const row = await db.getFirstAsync<{ rev: number | null }>(
    `SELECT SUM(o.subtotal) AS rev FROM orders o ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${lCond} ${mCond}`,
    [prevFrom.toISOString(), prevTo.toISOString(), ...lParam, ...mParam]
  );
  return row?.rev ?? 0;
}

export async function getWeeklyRevenue(
  db: SQLiteDatabase,
  anchorDate: Date = new Date(),
  labelIds?: number[],
  paymentMethods?: string[]
): Promise<number[]> {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(anchorDate, i), 'yyyy-MM-dd'));
  }

  const from = startOfDay(subDays(anchorDate, 6)).toISOString();
  const to = endOfDay(anchorDate).toISOString();

  const { join, cond: lCond, param: lParam } = labelJoin(labelIds);
  const { cond: mCond, param: mParam } = methodCond(paymentMethods);
  const rows = await db.getAllAsync<{ day: string; rev: number }>(
    `SELECT date(o.created_at) AS day, SUM(o.subtotal) AS rev
     FROM orders o ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${lCond} ${mCond}
     GROUP BY day`,
    [from, to, ...lParam, ...mParam]
  );

  const map: Record<string, number> = {};
  rows.forEach((r) => { map[r.day] = r.rev; });
  return days.map((d) => map[d] ?? 0);
}

export async function getExpenseSummaryForPeriod(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[]
): Promise<ExpenseSummary> {
  return getExpenseSummary(db, from, to, labelIds);
}

export async function getTopProducts(
  db: SQLiteDatabase,
  from: string,
  to: string,
  labelIds?: number[],
  paymentMethods?: string[]
): Promise<ProductStat[]> {
  const { join, cond: lCond, param: lParam } = labelJoin(labelIds);
  const { cond: mCond, param: mParam } = methodCond(paymentMethods);
  return db.getAllAsync<ProductStat>(
    `SELECT
       oi.product_name,
       SUM(oi.quantity) AS totalQuantity,
       SUM(oi.subtotal) AS totalRevenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id ${join}
     WHERE o.created_at >= ? AND o.created_at <= ? ${lCond} ${mCond}
     GROUP BY oi.product_name
     ORDER BY totalRevenue DESC
     LIMIT 10`,
    [from, to, ...lParam, ...mParam]
  );
}
