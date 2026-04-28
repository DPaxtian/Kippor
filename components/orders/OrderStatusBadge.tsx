import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DeliveryStatus, PaymentMethod, PaymentStatus } from '@/types';

const DELIVERY_CLASSES: Record<DeliveryStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-warning-soft dark:bg-warning-soft-dark', text: 'text-warning dark:text-warning-dark' },
  delivered: { bg: 'bg-success-soft dark:bg-success-soft-dark', text: 'text-success dark:text-success-dark' },
};

const PAYMENT_CLASSES: Record<PaymentStatus, { bg: string; text: string }> = {
  unpaid: { bg: 'bg-error-soft dark:bg-error-soft-dark', text: 'text-error dark:text-error-dark' },
  paid: { bg: 'bg-success-soft dark:bg-success-soft-dark', text: 'text-success dark:text-success-dark' },
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const { t } = useTranslation();
  const { bg, text } = DELIVERY_CLASSES[status];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>
        {status === 'pending' ? t('common.pending') : t('common.delivered')}
      </Text>
    </View>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();
  const { bg, text } = PAYMENT_CLASSES[status];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>
        {status === 'unpaid' ? t('common.notPaid') : t('common.paidSingular')}
      </Text>
    </View>
  );
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const { t } = useTranslation();
  return (
    <View className="rounded-full px-2.5 py-0.5 bg-surface-muted dark:bg-surface-muted-dark">
      <Text className="text-xs font-medium text-content-muted dark:text-content-muted-dark">
        {t(`paymentMethod.${method}`)}
      </Text>
    </View>
  );
}
