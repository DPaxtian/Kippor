import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { useAccentColor } from '@/hooks/use-accent-color';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';
import type { StyleProp, ViewStyle } from 'react-native';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({ product, onPress, style }: ProductCardProps) {
  const { color, soft } = useAccentColor();

  return (
    <Pressable
      onPress={onPress}
      style={style}
      className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden active:opacity-70"
    >
      <View style={{ aspectRatio: 1.2, backgroundColor: soft }} className="items-center justify-center">
        {product.image_uri ? (
          <Image source={{ uri: product.image_uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Text style={{ fontSize: 48 }}>{product.emoji ?? '🧁'}</Text>
        )}
      </View>
      <View className="px-3 pt-2.5 pb-3">
        <Text className="text-sm font-semibold text-content dark:text-content-dark leading-snug" numberOfLines={2} style={{ minHeight: 36 }}>
          {product.name}
        </Text>
        <Text style={{ color }} className="text-base font-bold mt-1">
          {formatCurrency(product.price)}
        </Text>
      </View>
    </Pressable>
  );
}
