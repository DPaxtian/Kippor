import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/catalog/ProductCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useProductsStore } from '@/store/products-store';

export default function CatalogScreen() {
  const { products, isLoading, fetchProducts } = useProductsStore();
  const { color, soft } = useAccentColor();

  useFocusEffect(useCallback(() => { fetchProducts(); }, [fetchProducts]));

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      {isLoading && products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={color} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => router.push(`/catalog/${item.id}`)} style={{ flex: 1 }} />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
          ListHeaderComponent={
            <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3 px-4">
              {products.length} {products.length === 1 ? 'producto' : 'productos'} activos
            </Text>
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-32 px-8">
              <View style={{ backgroundColor: soft }} className="w-20 h-20 rounded-2xl items-center justify-center mb-5">
                <IconSymbol name="tag.fill" size={40} color={color} />
              </View>
              <Text className="text-xl font-bold text-content dark:text-content-dark text-center mb-2">Sin productos</Text>
              <Text className="text-base text-content-muted dark:text-content-muted-dark text-center">
                Toca + para agregar tu primer producto al catálogo.
              </Text>
            </View>
          }
        />
      )}
      <Pressable
        onPress={() => router.push('/catalog/new')}
        style={{ backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center active:opacity-80"
      >
        <IconSymbol name="plus" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
