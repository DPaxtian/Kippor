import { Text, View } from 'react-native';
import type { DeliveryStatus, PaymentMethod, PaymentStatus } from '@/types';

const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pendiente',
  delivered: 'Entregado',
};

const DELIVERY_CLASSES: Record<DeliveryStatus, { bg: string; text: string }> = {
  pending: {
    bg: 'bg-warning-soft dark:bg-warning-soft-dark',
    text: 'text-warning dark:text-warning-dark',
  },
  delivered: {
    bg: 'bg-success-soft dark:bg-success-soft-dark',
    text: 'text-success dark:text-success-dark',
  },
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'No pagado',
  paid: 'Pagado',
};

const PAYMENT_CLASSES: Record<PaymentStatus, { bg: string; text: string }> = {
  unpaid: {
    bg: 'bg-error-soft dark:bg-error-soft-dark',
    text: 'text-error dark:text-error-dark',
  },
  paid: {
    bg: 'bg-success-soft dark:bg-success-soft-dark',
    text: 'text-success dark:text-success-dark',
  },
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const { bg, text } = DELIVERY_CLASSES[status];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>
        {DELIVERY_LABELS[status]}
      </Text>
    </View>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { bg, text } = PAYMENT_CLASSES[status];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>
        {PAYMENT_LABELS[status]}
      </Text>
    </View>
  );
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <View className="rounded-full px-2.5 py-0.5 bg-surface-muted dark:bg-surface-muted-dark">
      <Text className="text-xs font-medium text-content-muted dark:text-content-muted-dark">
        {METHOD_LABELS[method]}
      </Text>
    </View>
  );
}
