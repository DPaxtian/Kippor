import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomToggle } from '@/components/ui/CustomToggle';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { LabelPicker } from '@/components/labels/LabelPickerSheet';
import { useLabelsStore } from '@/store/labels-store';
import { useOrdersStore } from '@/store/orders-store';
import { useProductsStore } from '@/store/products-store';
import { useUIStore } from '@/store/ui-store';
import type { CreateOrderItemInput, DeliveryStatus, PaymentMethod, PaymentStatus, Product } from '@/types';
import { cancelDeliveryNotification, scheduleDeliveryNotification } from '@/utils/notifications';
import { format } from 'date-fns';
import { useDateLocale, useDateFormat } from '@/hooks/use-locale';
import { ModalHandle } from '@/components/ui/ModalHandle';

interface FormItem { product: Product; quantity: number; }
interface FormState {
  clientName: string; clientAddress: string; hasDelivery: boolean; shippingCost: string;
  deliveryStatus: DeliveryStatus; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod;
  notes: string; items: FormItem[];
  isScheduled: boolean; deliveryDate: string; advancePayment: string;
}
type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'items'>; value: string | boolean }
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; index: number }
  | { type: 'UPDATE_QTY'; index: number; delta: number }
  | { type: 'LOAD'; state: FormState };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
    case 'LOAD': return action.state;
    case 'ADD_ITEM': {
      const existing = state.items.findIndex((i) => i.product.id === action.product.id);
      if (existing >= 0) {
        const items = [...state.items];
        items[existing] = { ...items[existing], quantity: items[existing].quantity + 1 };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case 'REMOVE_ITEM': return { ...state, items: state.items.filter((_, i) => i !== action.index) };
    case 'UPDATE_QTY': {
      const items = [...state.items];
      const newQty = items[action.index].quantity + action.delta;
      if (newQty <= 0) return { ...state, items: items.filter((_, i) => i !== action.index) };
      items[action.index] = { ...items[action.index], quantity: newQty };
      return { ...state, items };
    }
    default: return state;
  }
}

const emptyState: FormState = {
  clientName: '', clientAddress: '', hasDelivery: false, shippingCost: '',
  deliveryStatus: 'pending', paymentStatus: 'unpaid', paymentMethod: 'cash', notes: '', items: [],
  isScheduled: false, deliveryDate: '', advancePayment: '',
};

export default function EditOrderScreen() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const dateFormat = useDateFormat();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateOrder, selectedOrder, selectedOrderItems, selectedOrderLabels, fetchOrderById } = useOrdersStore();
  const { products, fetchProducts } = useProductsStore();
  const { fetchLabels } = useLabelsStore();
  const { colorScheme } = useUIStore();
  const { fmt, symbol } = useCurrency();
  const { color, soft } = useAccentColor();
  const navigation = useNavigation();

  const [state, dispatch] = useReducer(formReducer, emptyState);
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [loaded, setLoaded] = useState(false);

  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';

  const PAYMENT_METHOD_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: 'cash', label: t('paymentMethod.cash'), icon: 'banknote.fill' },
    { key: 'card', label: t('paymentMethod.card'), icon: 'creditcard.fill' },
    { key: 'transfer', label: t('paymentMethod.transfer'), icon: 'iphone' },
  ];

  const DELIVERY_STATUS_OPTIONS: { key: DeliveryStatus; label: string; icon: string }[] = [
    { key: 'pending', label: t('common.pending'), icon: 'clock.fill' },
    { key: 'delivered', label: t('common.delivered'), icon: 'checkmark.circle.fill' },
  ];

  useEffect(() => { fetchProducts(); fetchLabels(); }, [fetchProducts, fetchLabels]);

  useEffect(() => {
    if (!selectedOrder || selectedOrder.id !== Number(id)) {
      fetchOrderById(Number(id));
    }
  }, [id]); // eslint-disable-line

  // Precarga el formulario cuando el pedido está disponible
  useEffect(() => {
    if (!selectedOrder || selectedOrder.id !== Number(id) || loaded) return;
    dispatch({
      type: 'LOAD',
      state: {
        clientName: selectedOrder.client_name,
        clientAddress: selectedOrder.client_address ?? '',
        hasDelivery: selectedOrder.has_delivery === 1,
        shippingCost: selectedOrder.shipping_cost > 0 ? String(selectedOrder.shipping_cost) : '',
        deliveryStatus: selectedOrder.delivery_status,
        paymentStatus: selectedOrder.payment_status,
        paymentMethod: selectedOrder.payment_method,
        notes: selectedOrder.notes ?? '',
        isScheduled: !!selectedOrder.delivery_date,
        deliveryDate: selectedOrder.delivery_date ?? '',
        advancePayment: selectedOrder.advance_payment > 0 ? String(selectedOrder.advance_payment) : '',
        items: selectedOrderItems.map((item) => ({
          product: {
            id: item.product_id ?? 0,
            name: item.product_name,
            price: item.product_price,
            emoji: null,
            image_uri: null,
            description: null,
            is_active: 1,
            created_at: '',
          },
          quantity: item.quantity,
        })),
      },
    });
    setLabelIds(selectedOrderLabels.map((l) => l.id));
    setLoaded(true);
  }, [selectedOrder, selectedOrderItems, selectedOrderLabels, id, loaded]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} className="px-1 active:opacity-60">
          <Text style={{ color }} className="text-base font-medium">{t('common.cancel')}</Text>
        </Pressable>
      ),
    });
  }, [navigation, color]);

  const subtotal = state.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const shippingCost = state.hasDelivery ? parseFloat(state.shippingCost.replace(',', '.')) || 0 : 0;
  const total = subtotal + shippingCost;
  const advancePayment = state.isScheduled ? parseFloat(state.advancePayment.replace(',', '.')) || 0 : 0;
  const balance = total - advancePayment;

  async function handleSave() {
    if (!state.clientName.trim()) { Alert.alert(t('common.error'), t('orderForm.errorClientRequired')); return; }
    if (state.items.length === 0) { Alert.alert(t('common.error'), t('orderForm.errorNoProducts')); return; }
    if (state.isScheduled && !state.deliveryDate) { Alert.alert(t('common.error'), t('orderForm.errorDateRequired')); return; }
    if (advancePayment > total) { Alert.alert(t('common.error'), t('orderForm.errorAdvanceExceeds', { total: fmt(total) })); return; }
    const items: Omit<CreateOrderItemInput, 'order_id'>[] = state.items.map((i) => ({
      product_id: i.product.id, product_name: i.product.name, product_price: i.product.price,
      quantity: i.quantity, subtotal: i.product.price * i.quantity,
    }));
    setSaving(true);
    try {
      const numId = Number(id);
      await updateOrder(numId, {
        client_name: state.clientName.trim(),
        client_address: state.clientAddress.trim() || null,
        has_delivery: state.hasDelivery ? 1 : 0,
        shipping_cost: shippingCost,
        subtotal,
        total,
        delivery_status: state.deliveryStatus,
        payment_status: state.paymentStatus,
        payment_method: state.paymentMethod,
        notes: state.notes.trim() || null,
        delivery_date: state.isScheduled ? state.deliveryDate : null,
        advance_payment: advancePayment,
      }, items, labelIds);
      if (state.isScheduled && state.deliveryDate) {
        await scheduleDeliveryNotification(numId, state.clientName.trim(), state.deliveryDate).catch(() => {});
      } else {
        await cancelDeliveryNotification(numId).catch(() => {});
      }
      router.back();
    } catch { Alert.alert(t('common.error'), 'No se pudo guardar el pedido.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-4 gap-5 pb-6" automaticallyAdjustKeyboardInsets>

          <SectionTitle>{t('orderForm.sectionClient')}</SectionTitle>
          <FormField label={t('orderForm.clientName')} required accentColor={color}>
            <AppTextInput value={state.clientName} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'clientName', value: v })} placeholder={t('orderForm.clientNamePlaceholder')} placeholderTextColor="#9A8A80" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark" />
          </FormField>
          <View className="flex-row items-center justify-between bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl px-4 py-3 border border-border dark:border-border-dark">
            <Text className="text-base text-content dark:text-content-dark">{t('orderForm.deliveryToggle')}</Text>
            <CustomToggle value={state.hasDelivery} onValueChange={(v) => dispatch({ type: 'SET_FIELD', field: 'hasDelivery', value: v })} />
          </View>
          {state.hasDelivery && (
            <>
              <FormField label={t('orderForm.deliveryAddress')} accentColor={color}>
                <AppTextInput value={state.clientAddress} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'clientAddress', value: v })} placeholder={t('orderForm.deliveryAddressPlaceholder')} placeholderTextColor="#9A8A80" multiline numberOfLines={2} textAlignVertical="top" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark min-h-[56px]" />
              </FormField>
              <FormField label={t('orderForm.shippingCost')} accentColor={color}>
                <View className="flex-row items-center bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4">
                  <Text className="text-base text-content-muted dark:text-content-muted-dark mr-2">{symbol}</Text>
                  <AppTextInput value={state.shippingCost} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'shippingCost', value: v })} placeholder="0.00" placeholderTextColor="#9A8A80" keyboardType="decimal-pad" className="flex-1 py-3 text-base text-content dark:text-content-dark" />
                </View>
              </FormField>
            </>
          )}

          <SectionTitle>{t('orderForm.sectionProducts')}</SectionTitle>
          {state.items.map((item, index) => (
            <View key={`${item.product.id}-${index}`} className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl border border-border dark:border-border-dark px-4 py-3 flex-row items-center gap-3">
              <Pressable onPress={() => dispatch({ type: 'REMOVE_ITEM', index })} className="active:opacity-60">
                <IconSymbol name="xmark" size={16} color={iconColor} />
              </Pressable>
              <View style={{ backgroundColor: soft }} className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0">
                <Text style={{ fontSize: 22 }}>{item.product.emoji ?? '🧁'}</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-semibold text-content dark:text-content-dark" numberOfLines={1}>{item.product.name}</Text>
                <Text className="text-xs text-content-muted dark:text-content-muted-dark mt-0.5">{fmt(item.product.price)} c/u · {fmt(item.product.price * item.quantity)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable onPress={() => dispatch({ type: 'UPDATE_QTY', index, delta: -1 })} className="w-7 h-7 rounded-full bg-surface-muted dark:bg-surface-muted-dark items-center justify-center active:opacity-60">
                  <Text className="text-base font-bold text-content-muted dark:text-content-muted-dark">−</Text>
                </Pressable>
                <Text className="text-base font-semibold text-content dark:text-content-dark w-5 text-center">{item.quantity}</Text>
                <Pressable onPress={() => dispatch({ type: 'UPDATE_QTY', index, delta: 1 })} style={{ backgroundColor: color }} className="w-7 h-7 rounded-full items-center justify-center active:opacity-60">
                  <Text className="text-base font-bold text-white">+</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable onPress={() => setShowProductPicker(true)} className="flex-row items-center gap-2 border-2 border-dashed rounded-xl py-3 px-4 active:opacity-70" style={{ borderColor: color + '66' }}>
            <IconSymbol name="plus" size={18} color={color} />
            <Text style={{ color }} className="font-semibold">{t('orderForm.addProduct')}</Text>
          </Pressable>

          <SectionTitle>{t('orderForm.sectionScheduled')}</SectionTitle>
          <View className="flex-row items-center justify-between bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl px-4 py-3 border border-border dark:border-border-dark">
            <View className="flex-1">
              <Text className="text-base text-content dark:text-content-dark">{t('orderForm.scheduleToggle')}</Text>
              <Text className="text-xs text-content-muted dark:text-content-muted-dark mt-0.5">{t('orderForm.scheduleSubtitle')}</Text>
            </View>
            <CustomToggle value={state.isScheduled} onValueChange={(v) => {
              dispatch({ type: 'SET_FIELD', field: 'isScheduled', value: v });
              if (v && state.deliveryStatus === 'delivered') dispatch({ type: 'SET_FIELD', field: 'deliveryStatus', value: 'pending' });
            }} />
          </View>
          {state.isScheduled && (
            <>
              <FormField label={t('orderForm.deliveryDate')} required accentColor={color}>
                <Pressable
                  onPress={() => {
                    setTempDate(state.deliveryDate ? new Date(state.deliveryDate) : new Date());
                    setShowDatePicker(true);
                  }}
                  className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-70"
                >
                  <Text className={`text-base ${state.deliveryDate ? 'text-content dark:text-content-dark font-medium' : 'text-content-subtle dark:text-content-subtle-dark'}`}>
                    {state.deliveryDate
                      ? format(new Date(state.deliveryDate), dateFormat, { locale: dateLocale })
                      : t('orderForm.deliveryDatePlaceholder')}
                  </Text>
                  <IconSymbol name="calendar" size={16} color={iconColor} />
                </Pressable>
              </FormField>
              <FormField label={t('orderForm.advancePayment')} accentColor={color}>
                <View className="flex-row items-center bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4">
                  <Text className="text-base text-content-muted dark:text-content-muted-dark mr-2">{symbol}</Text>
                  <AppTextInput
                    value={state.advancePayment}
                    onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'advancePayment', value: v })}
                    placeholder="0.00"
                    placeholderTextColor="#9A8A80"
                    keyboardType="decimal-pad"
                    className="flex-1 py-3 text-base text-content dark:text-content-dark"
                  />
                </View>
              </FormField>
            </>
          )}

          <SectionTitle>{t('orderForm.sectionPayment')}</SectionTitle>
          <FormField label={t('orderForm.deliveryStatusLabel')} accentColor={color}>
            <View className="flex-row gap-2">
              {DELIVERY_STATUS_OPTIONS.map(({ key, label, icon }) => {
                const isDisabled = state.isScheduled && key === 'delivered';
                const isSelected = state.deliveryStatus === key;
                return (
                  <Pressable key={key}
                    onPress={() => { if (!isDisabled) dispatch({ type: 'SET_FIELD', field: 'deliveryStatus', value: key }); }}
                    style={isSelected && !isDisabled ? { backgroundColor: color, borderColor: color } : undefined}
                    className={`flex-1 rounded-xl py-2.5 items-center border gap-1 ${isDisabled ? 'opacity-30 bg-surface-elevated dark:bg-surface-elevated-dark border-border dark:border-border-dark' : isSelected ? 'border-transparent' : 'bg-surface-elevated dark:bg-surface-elevated-dark border-border dark:border-border-dark'}`}
                  >
                    <IconSymbol name={icon as any} size={14} color={isSelected && !isDisabled ? '#FFFFFF' : iconColor} />
                    <Text className={`text-xs font-semibold ${isSelected && !isDisabled ? 'text-white' : 'text-content-muted dark:text-content-muted-dark'}`}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </FormField>
          <FormField label={t('orderForm.paymentMethod')} accentColor={color}>
            <View className="flex-row gap-2">
              {PAYMENT_METHOD_OPTIONS.map(({ key, label, icon }) => (
                <Pressable key={key} onPress={() => dispatch({ type: 'SET_FIELD', field: 'paymentMethod', value: key })}
                  style={state.paymentMethod === key ? { backgroundColor: color, borderColor: color } : undefined}
                  className={`flex-1 rounded-xl py-2.5 items-center border gap-1 ${state.paymentMethod === key ? 'border-transparent' : 'bg-surface-elevated dark:bg-surface-elevated-dark border-border dark:border-border-dark'}`}
                >
                  <IconSymbol name={icon as any} size={14} color={state.paymentMethod === key ? '#FFFFFF' : iconColor} />
                  <Text className={`text-xs font-semibold ${state.paymentMethod === key ? 'text-white' : 'text-content-muted dark:text-content-muted-dark'}`}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </FormField>
          <View className="flex-row items-center justify-between bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl px-4 py-3 border border-border dark:border-border-dark">
            <Text className="text-base text-content dark:text-content-dark">{t('orderForm.paymentReceived')}</Text>
            <CustomToggle value={state.paymentStatus === 'paid'} onValueChange={(v) => dispatch({ type: 'SET_FIELD', field: 'paymentStatus', value: v ? 'paid' : 'unpaid' })} />
          </View>
          <FormField label={t('common.labels')} accentColor={color}>
            <LabelPicker selectedIds={labelIds} onChange={setLabelIds} />
          </FormField>
          <FormField label={t('orderForm.notesLabel')} accentColor={color}>
            <AppTextInput value={state.notes} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'notes', value: v })} placeholder={t('orderForm.notesPlaceholder')} placeholderTextColor="#9A8A80" multiline numberOfLines={3} textAlignVertical="top" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark min-h-[72px]" />
          </FormField>

          {/* Total + save — inline so the keyboard never covers it */}
          <View className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl px-4 pt-3 pb-4 mt-2">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">{t('common.subtotal')}</Text>
                <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark">{fmt(subtotal)}</Text>
              </View>
              {state.hasDelivery && shippingCost > 0 && (
                <View className="items-center">
                  <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">{t('common.shipping')}</Text>
                  <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark">{fmt(shippingCost)}</Text>
                </View>
              )}
              {state.isScheduled && advancePayment > 0 && (
                <View className="items-center">
                  <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">{t('common.advance')}</Text>
                  <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark">{fmt(advancePayment)}</Text>
                </View>
              )}
              <View className="items-end">
                {state.isScheduled && advancePayment > 0 ? (
                  <>
                    <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">{t('common.balance')}</Text>
                    <Text style={{ color }} className="text-xl font-bold">{fmt(balance)}</Text>
                  </>
                ) : (
                  <>
                    <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">{t('common.total')}</Text>
                    <Text style={{ color }} className="text-xl font-bold">{fmt(total)}</Text>
                  </>
                )}
              </View>
            </View>
            <Pressable onPress={handleSave} disabled={saving} style={{ backgroundColor: color }} className="rounded-xl py-4 items-center active:opacity-80">
              <Text className="text-white font-semibold text-base">{saving ? t('common.saving') : t('orderForm.saveChanges')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date picker modal */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowDatePicker(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-8">
              <ModalHandle onClose={() => setShowDatePicker(false)} />
              <View className="flex-row items-center justify-between px-5 py-3">
                <Pressable onPress={() => setShowDatePicker(false)} className="active:opacity-60">
                  <Text className="text-base text-content-muted dark:text-content-muted-dark">{t('common.cancel')}</Text>
                </Pressable>
                <Text className="text-base font-semibold text-content dark:text-content-dark">{t('orderForm.deliveryDateModal')}</Text>
                <Pressable onPress={() => {
                  dispatch({ type: 'SET_FIELD', field: 'deliveryDate', value: tempDate.toISOString() });
                  setShowDatePicker(false);
                }} className="active:opacity-60">
                  <Text style={{ color }} className="text-base font-semibold">{t('common.done')}</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center' }}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(_, date) => { if (date) setTempDate(date); }}
                  style={{ height: 200, width: '100%' }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Product picker */}
      <Modal visible={showProductPicker} transparent animationType="slide" onRequestClose={() => setShowProductPicker(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowProductPicker(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-8">
              <ModalHandle onClose={() => setShowProductPicker(false)} />
              <Text className="text-lg font-bold text-content dark:text-content-dark px-5 py-3">{t('orderForm.selectProduct')}</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {products.length === 0 ? (
                  <View className="p-5 items-center">
                    <Text className="text-content-muted dark:text-content-muted-dark text-sm text-center">{t('orderForm.noProducts')}</Text>
                  </View>
                ) : products.map((product) => (
                  <Pressable key={product.id} onPress={() => { dispatch({ type: 'ADD_ITEM', product }); setShowProductPicker(false); }} className="flex-row items-center gap-3 px-5 py-3 border-b border-border dark:border-border-dark active:bg-surface-muted dark:active:bg-surface-muted-dark">
                    <View style={{ backgroundColor: soft }} className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0">
                      <Text style={{ fontSize: 22 }}>{product.emoji ?? '🧁'}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-base font-semibold text-content dark:text-content-dark" numberOfLines={1}>{product.name}</Text>
                      <Text className="text-sm text-content-muted dark:text-content-muted-dark">{fmt(product.price)}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={iconColor} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider">{children}</Text>;
}

function FormField({ label, required, accentColor, children }: { label: string; required?: boolean; accentColor: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark mb-1.5">
        {label}{required && <Text style={{ color: accentColor }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}
