import * as Notifications from 'expo-notifications';
import { getDatabase } from '@/db/database';
import { getSalesSummary } from '@/db/reports';
import { formatCurrency } from '@/utils/format';
import i18n from '@/i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── IDs fijos para poder cancelar y reprogramar ──────────────────────────────

const MORNING_ID = 'kippor-morning-summary';
const EVENING_ID = 'kippor-evening-summary';
const DELIVERY_PREFIX = 'kippor-delivery-';

export function deliveryNotificationId(orderId: number): string {
  return `${DELIVERY_PREFIX}${orderId}`;
}

// ─── Notificación matutina ────────────────────────────────────────────────────

export async function scheduleMorningNotification(hour: number, minute: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MORNING_ID).catch(() => {});

  const db = await getDatabase();
  const now = new Date();
  const from = new Date(now); from.setHours(0, 0, 0, 0);
  const to = new Date(now); to.setHours(23, 59, 59, 999);
  const summary = await getSalesSummary(db, from.toISOString(), to.toISOString());

  const t = i18n.t.bind(i18n);
  const parts: string[] = [];
  if (summary.unpaidCount > 0) parts.push(t('notifications.morningOrders', { count: summary.unpaidCount }));
  if (summary.pendingDeliveries > 0) parts.push(t('notifications.morningDeliveries', { count: summary.pendingDeliveries }));
  const body = parts.length > 0
    ? t('notifications.morningBody_pending', { orders: parts[0], deliveries: parts[1] ?? parts[0] })
    : t('notifications.morningBody_clear');

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_ID,
    content: {
      title: t('notifications.morningTitle'),
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelMorningNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MORNING_ID).catch(() => {});
}

// ─── Notificación de cierre ───────────────────────────────────────────────────

export async function scheduleEveningNotification(hour: number, minute: number, currency: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(EVENING_ID).catch(() => {});

  const db = await getDatabase();
  const now = new Date();
  const from = new Date(now); from.setHours(0, 0, 0, 0);
  const to = new Date(now); to.setHours(23, 59, 59, 999);
  const summary = await getSalesSummary(db, from.toISOString(), to.toISOString());

  const t = i18n.t.bind(i18n);
  const revenue = formatCurrency(summary.totalRevenue, currency);
  const plural = summary.unpaidCount > 1 ? 's' : '';
  const body = summary.unpaidCount > 0
    ? t('notifications.eveningBody_unpaid', { revenue, count: summary.unpaidCount, plural })
    : t('notifications.eveningBody_clear', { revenue });

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ID,
    content: {
      title: t('notifications.eveningTitle'),
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelEveningNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(EVENING_ID).catch(() => {});
}

// ─── Notificación de entrega por pedido ──────────────────────────────────────

export async function scheduleDeliveryNotification(
  orderId: number,
  clientName: string,
  deliveryDate: string,
): Promise<void> {
  const id = deliveryNotificationId(orderId);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const date = new Date(deliveryDate);
  date.setHours(8, 0, 0, 0);

  if (date <= new Date()) return;

  const t = i18n.t.bind(i18n);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: t('notifications.deliveryTitle', { name: clientName }),
      body: t('notifications.deliveryBody'),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export async function cancelDeliveryNotification(orderId: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(deliveryNotificationId(orderId)).catch(() => {});
}
