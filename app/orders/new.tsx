import { router, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomToggle } from '@/components/ui/CustomToggle';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useOrdersStore } from '@/store/orders-store';
import { useProductsStore } from '@/store/products-store';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency } from '@/utils/format';
import type { CreateOrderItemInput, DeliveryStatus, PaymentMethod, PaymentStatus, Product } from '@/types';

interface FormItem { product: Product; quantity: number; }
interface FormState {
  clientName: string; clientAddress: string; hasDelivery: boolean; shippingCost: string;
  deliveryStatus: DeliveryStatus; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod;
  notes: string; items: FormItem[];
}
type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'items'>; value: string | boolean }
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; index: number }
  | { type: 'UPDATE_QTY'; index: number; delta: number };

const initialState: FormState = {
  clientName: '', clientAddress: '', hasDelivery: false, shippingCost: '',
  deliveryStatus: 'pending', paymentStatus: 'unpaid', paymentMethod: 'cash', notes: '', items: [],
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
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

const PAYMENT_METHOD_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: 'Efectivo', icon: 'banknote.fill' },
  { key: 'card', label: 'Tarjeta', icon: 'creditcard.fill' },
  { key: 'transfer', label: 'Transferencia', icon: 'iphone' },
];

export default function NewOrderScreen() {
  const { createOrder } = useOrdersStore();
  const { products, fetchProducts } = useProductsStore();
  const { colorScheme } = useUIStore();
  const { color, soft } = useAccentColor();
  const navigation = useNavigation();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [saving, setSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} className="px-1 active:opacity-60">
          <Text style={{ color }} className="text-base font-medium">Cancelar</Text>
        </Pressable>
      ),
    });
  }, [navigation, color]);

  const subtotal = state.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const shippingCost = state.hasDelivery ? parseFloat(state.shippingCost.replace(',', '.')) || 0 : 0;
  const total = subtotal + shippingCost;

  async function handleSave() {
    if (!state.clientName.trim()) { Alert.alert('Campo requerido', 'El nombre del cliente es obligatorio.'); return; }
    if (state.items.length === 0) { Alert.alert('Sin productos', 'Agrega al menos un producto al pedido.'); return; }
    const items: Omit<CreateOrderItemInput, 'order_id'>[] = state.items.map((i) => ({
      product_id: i.product.id, product_name: i.product.name, product_price: i.product.price,
      quantity: i.quantity, subtotal: i.product.price * i.quantity,
    }));
    setSaving(true);
    try {
      await createOrder({ client_name: state.clientName.trim(), client_address: state.clientAddress.trim() || null, has_delivery: state.hasDelivery ? 1 : 0, shipping_cost: shippingCost, delivery_status: state.deliveryStatus, payment_status: state.paymentStatus, payment_method: state.paymentMethod, notes: state.notes.trim() || null }, items);
      router.back();
    } catch { Alert.alert('Error', 'No se pudo guardar el pedido.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="p-4 gap-5 pb-32">

          <SectionTitle>Cliente</SectionTitle>
          <FormField label="Nombre del cliente" required accentColor={color}>
            <TextInput value={state.clientName} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'clientName', value: v })} placeholder="Nombre completo" placeholderTextColor="#9A8A80" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark" />
          </FormField>
          <View className="flex-row items-center justify-between bg-surface-elevated dark:bg-surface-elevated-dark rounded-xl px-4 py-3 border border-border dark:border-border-dark">
            <Text className="text-base text-content dark:text-content-dark">Envío a domicilio</Text>
            <CustomToggle value={state.hasDelivery} onValueChange={(v) => dispatch({ type: 'SET_FIELD', field: 'hasDelivery', value: v })} />
          </View>
          {state.hasDelivery && (
            <>
              <FormField label="Dirección de entrega" accentColor={color}>
                <TextInput value={state.clientAddress} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'clientAddress', value: v })} placeholder="Calle, número, colonia..." placeholderTextColor="#9A8A80" multiline numberOfLines={2} textAlignVertical="top" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark min-h-[56px]" />
              </FormField>
              <FormField label="Costo de envío" accentColor={color}>
                <TextInput value={state.shippingCost} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'shippingCost', value: v })} placeholder="0.00" placeholderTextColor="#9A8A80" keyboardType="decimal-pad" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark" />
              </FormField>
            </>
          )}

          <SectionTitle>Productos</SectionTitle>
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
                <Text className="text-xs text-content-muted dark:text-content-muted-dark mt-0.5">{formatCurrency(item.product.price)} c/u · {formatCurrency(item.product.price * item.quantity)}</Text>
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
            <Text style={{ color }} className="font-semibold">Agregar producto</Text>
          </Pressable>

          <SectionTitle>Pago y entrega</SectionTitle>
          <FormField label="Método de pago" accentColor={color}>
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
            <Text className="text-base text-content dark:text-content-dark">Pago recibido</Text>
            <CustomToggle value={state.paymentStatus === 'paid'} onValueChange={(v) => dispatch({ type: 'SET_FIELD', field: 'paymentStatus', value: v ? 'paid' : 'unpaid' })} />
          </View>
          <FormField label="Notas (opcional)" accentColor={color}>
            <TextInput value={state.notes} onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'notes', value: v })} placeholder="Instrucciones especiales, alergias..." placeholderTextColor="#9A8A80" multiline numberOfLines={3} textAlignVertical="top" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark min-h-[72px]" />
          </FormField>
        </ScrollView>

        {/* Footer */}
        <View className="absolute bottom-0 left-0 right-0 bg-surface-elevated dark:bg-surface-elevated-dark border-t border-border dark:border-border-dark px-4 pt-3 pb-6">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">Subtotal</Text>
              <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark">{formatCurrency(subtotal)}</Text>
            </View>
            {state.hasDelivery && shippingCost > 0 && (
              <View className="items-end">
                <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">Envío</Text>
                <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark">{formatCurrency(shippingCost)}</Text>
              </View>
            )}
            <View className="items-end">
              <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">Total</Text>
              <Text style={{ color }} className="text-xl font-bold">{formatCurrency(total)}</Text>
            </View>
          </View>
          <Pressable onPress={handleSave} disabled={saving} style={{ backgroundColor: color }} className="rounded-xl py-4 items-center active:opacity-80">
            <Text className="text-white font-semibold text-base">{saving ? 'Guardando...' : 'Guardar pedido'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Product picker */}
      <Modal visible={showProductPicker} transparent animationType="slide" onRequestClose={() => setShowProductPicker(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowProductPicker(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-8">
              <View className="items-center pt-3 pb-1">
                <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
              </View>
              <Text className="text-lg font-bold text-content dark:text-content-dark px-5 py-3">Selecciona producto</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {products.length === 0 ? (
                  <View className="p-5 items-center">
                    <Text className="text-content-muted dark:text-content-muted-dark text-sm text-center">No hay productos en el catálogo.{'\n'}Agrégalos desde la pestaña Catálogo.</Text>
                  </View>
                ) : products.map((product) => (
                  <Pressable key={product.id} onPress={() => { dispatch({ type: 'ADD_ITEM', product }); setShowProductPicker(false); }} className="flex-row items-center gap-3 px-5 py-3 border-b border-border dark:border-border-dark active:bg-surface-muted dark:active:bg-surface-muted-dark">
                    <View style={{ backgroundColor: soft }} className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0">
                      <Text style={{ fontSize: 22 }}>{product.emoji ?? '🧁'}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-base font-semibold text-content dark:text-content-dark" numberOfLines={1}>{product.name}</Text>
                      <Text className="text-sm text-content-muted dark:text-content-muted-dark">{formatCurrency(product.price)}</Text>
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
