import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useProductsStore } from '@/store/products-store';
import { useUIStore } from '@/store/ui-store';

const EMOJI_OPTIONS = ['🧁', '🎂', '🍰', '🍫', '🍪', '🍞', '🥐', '🍩', '🌸', '🍋', '🍓', '🍌'];

export default function EditProductScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, updateProduct, deleteProduct } = useProductsStore();
  const { colorScheme } = useUIStore();
  const { color, soft } = useAccentColor();

  const product = products.find((p) => p.id === Number(id));
  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUri, setImageUri] = useState<string | null>(product?.image_uri ?? null);
  const [emoji, setEmoji] = useState(product?.emoji ?? '🧁');
  const [saving, setSaving] = useState(false);

  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';

  useEffect(() => { if (!product) router.back(); }, [product]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }
  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert(t('catalog.permissionRequired'), t('catalog.errorCamera')); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch {
      Alert.alert(t('catalog.cameraUnavailable'), t('catalog.errorCameraUnavailable'));
    }
  }
  async function handleSave() {
    if (!name.trim()) { Alert.alert(t('common.error'), t('catalog.errorNameRequired')); return; }
    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) { Alert.alert(t('common.error'), t('catalog.errorInvalidPrice')); return; }
    setSaving(true);
    try {
      await updateProduct(Number(id), { name: name.trim(), price: parsedPrice, description: description.trim() || null, image_uri: imageUri, emoji });
      router.back();
    } catch { Alert.alert(t('common.error'), t('catalog.errorSave')); }
    finally { setSaving(false); }
  }
  function handleDelete() {
    Alert.alert(t('catalog.deleteProduct'), t('catalog.deleteMessage', { name: product?.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteProduct(Number(id)); router.back(); } },
    ]);
  }

  if (!product) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 124 : 0} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-4 gap-5">
          <View className="items-center">
            {imageUri ? (
              <Pressable onPress={pickImage} className="active:opacity-70">
                <Image source={{ uri: imageUri }} className="w-32 h-32 rounded-2xl" contentFit="cover" />
              </Pressable>
            ) : (
              <View style={{ backgroundColor: soft }} className="w-24 h-24 rounded-2xl items-center justify-center mb-3">
                <Text style={{ fontSize: 48 }}>{emoji}</Text>
              </View>
            )}
            <View className="flex-row gap-2 mt-2">
              <Pressable onPress={takePhoto} className="flex-row items-center gap-1.5 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-3 py-2 active:opacity-70">
                <IconSymbol name="camera.fill" size={14} color={iconColor} />
                <Text className="text-sm text-content-muted dark:text-content-muted-dark">{t('catalog.camera')}</Text>
              </Pressable>
              <Pressable onPress={pickImage} className="flex-row items-center gap-1.5 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-3 py-2 active:opacity-70">
                <IconSymbol name="photo" size={14} color={iconColor} />
                <Text className="text-sm text-content-muted dark:text-content-muted-dark">{t('catalog.gallery')}</Text>
              </Pressable>
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark mb-2">{t('catalog.quickEmoji')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <Pressable key={e} onPress={() => { setEmoji(e); setImageUri(null); }}
                  style={emoji === e && !imageUri ? { backgroundColor: soft, borderWidth: 2, borderColor: color } : undefined}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${emoji === e && !imageUri ? '' : 'bg-surface-muted dark:bg-surface-muted-dark border border-transparent'}`}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark mb-1.5">
              {t('catalog.nameLabel')} <Text style={{ color }}>*</Text>
            </Text>
            <AppTextInput value={name} onChangeText={setName} placeholderTextColor="#9A8A80" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark" />
          </View>
          <View>
            <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark mb-1.5">
              {t('catalog.priceLabel')} <Text style={{ color }}>*</Text>
            </Text>
            <AppTextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholderTextColor="#9A8A80" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark" />
          </View>
          <View>
            <Text className="text-sm font-medium text-content-muted dark:text-content-muted-dark mb-1.5">
              {t('catalog.descriptionLabel')} <Text className="text-content-subtle dark:text-content-subtle-dark">{t('catalog.optional')}</Text>
            </Text>
            <AppTextInput value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor="#9A8A80" className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark min-h-[80px]" />
          </View>

          <Pressable onPress={handleSave} disabled={saving} style={{ backgroundColor: color }} className="rounded-xl py-4 items-center active:opacity-80">
            <Text className="text-white font-semibold text-base">{saving ? t('common.saving') : t('catalog.saveChanges')}</Text>
          </Pressable>
          <Pressable onPress={handleDelete} className="border border-error dark:border-error-dark rounded-xl py-4 items-center active:opacity-80">
            <Text className="text-error dark:text-error-dark font-semibold text-base">{t('catalog.deleteProduct')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
