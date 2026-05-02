import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useUIStore, type AccentPalette, type CurrencyCode } from '@/store/ui-store';
import { PALETTES } from '@/constants/palette';
import { getCurrencySymbol } from '@/utils/format';
import { AppTextInput } from '@/components/ui/AppTextInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CURRENCY_KEYS = ['MXN', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'PEN', 'GTQ', 'CRC'] as CurrencyCode[];

const PALETTE_OPTIONS: { key: AccentPalette; label: string }[] = [
  { key: 'terracota', label: 'Terracota' },
  { key: 'rosa', label: 'Rosa' },
  { key: 'miel', label: 'Miel' },
  { key: 'oliva', label: 'Oliva' },
  { key: 'pizarra', label: 'Pizarra' },
];

const TOTAL_STEPS = 4;

export function OnboardingModal({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  const { color, soft } = useAccentColor();
  const insets = useSafeAreaInsets();
  const {
    colorScheme, businessName, setBusinessName, currency, setCurrency,
    accentPalette, setAccentPalette, completeOnboarding,
  } = useUIStore();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(0);
  const [nameInput, setNameInput] = useState(businessName === 'Mi negocio' ? '' : businessName);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const iconColor = isDark ? '#7A6E66' : '#9A8A80';
  const bg = isDark ? '#171311' : '#FAF7F4';
  const bgElevated = isDark ? '#211C19' : '#FFFFFF';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const contentColor = isDark ? '#F4EDE7' : '#1F1815';
  const contentMuted = isDark ? '#B8ADA5' : '#6B5D54';

  function goToStep(n: number) {
    setStep(n);
    flatListRef.current?.scrollToIndex({ index: n, animated: true });
  }

  function handleStep3() {
    const trimmed = nameInput.trim();
    if (trimmed) setBusinessName(trimmed);
    goToStep(3);
  }

  function handleFinish(goToCatalog: boolean) {
    const trimmed = nameInput.trim();
    if (trimmed) setBusinessName(trimmed);
    completeOnboarding();
    if (goToCatalog) router.replace('/(tabs)/catalog');
  }

  const steps = [
    // ── Paso 1: Bienvenida ────────────────────────────────────────────────────
    <View key="step1" style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
      <View style={{ backgroundColor: color, width: 80, height: 80, borderRadius: 24 }} className="items-center justify-center mb-8">
        <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800' }}>K</Text>
      </View>
      <Text style={{ color: contentColor }} className="text-3xl font-bold text-center mb-3">
        {t('onboarding.step1Title')}
      </Text>
      <Text style={{ color: contentMuted }} className="text-base text-center leading-6">
        {t('onboarding.step1Subtitle')}
      </Text>
    </View>,

    // ── Paso 2: Color accent ──────────────────────────────────────────────────
    <View key="step2" style={{ width: SCREEN_WIDTH }} className="flex-1 justify-center px-8">
      <Text style={{ color: contentColor }} className="text-3xl font-bold mb-2">
        {t('onboarding.step2Title')}
      </Text>
      <Text style={{ color: contentMuted }} className="text-base mb-10 leading-6">
        {t('onboarding.step2Subtitle')}
      </Text>
      <View className="gap-3">
        {PALETTE_OPTIONS.map(({ key, label }) => {
          const p = PALETTES[key];
          const dotColor = isDark ? p.primaryDark : p.primary;
          const softColor = isDark ? p.primarySoftDark : p.primarySoft;
          const isSelected = accentPalette === key;
          return (
            <Pressable
              key={key}
              onPress={() => setAccentPalette(key)}
              style={{
                backgroundColor: isSelected ? softColor : bgElevated,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? dotColor : border,
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
              className="active:opacity-70"
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: dotColor }} />
              <Text style={{ color: isSelected ? dotColor : contentColor, fontWeight: isSelected ? '700' : '500', fontSize: 16, flex: 1 }}>
                {label}
              </Text>
              {isSelected && (
                <Text style={{ color: dotColor, fontWeight: '700' }}>✓</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>,

    // ── Paso 3: Nombre y moneda ───────────────────────────────────────────────
    <KeyboardAvoidingView
      key="step3"
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 justify-center px-8"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={{ color: contentColor }} className="text-3xl font-bold mb-2">
        {t('onboarding.step3Title')}
      </Text>
      <Text style={{ color: contentMuted }} className="text-base mb-8 leading-6">
        {t('onboarding.step3Subtitle')}
      </Text>

      <Text style={{ color: contentMuted }} className="text-xs font-semibold uppercase tracking-wider mb-2 px-1">
        {t('onboarding.step3NameLabel')}
      </Text>
      <AppTextInput
        value={nameInput}
        onChangeText={setNameInput}
        placeholder={t('onboarding.step3NamePlaceholder')}
        placeholderTextColor={iconColor}
        returnKeyType="done"
        onSubmitEditing={handleStep3}
        style={{
          backgroundColor: bgElevated,
          borderColor: border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: contentColor,
          marginBottom: 20,
        }}
      />

      <Text style={{ color: contentMuted }} className="text-xs font-semibold uppercase tracking-wider mb-2 px-1">
        {t('onboarding.step3CurrencyLabel')}
      </Text>
      <Pressable
        onPress={() => setShowCurrencyPicker(true)}
        style={{ backgroundColor: bgElevated, borderColor: border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}
        className="flex-row items-center justify-between active:opacity-70"
      >
        <Text style={{ color: contentColor, fontSize: 16 }}>
          {getCurrencySymbol(currency)} {currency}
        </Text>
        <Text style={{ color: iconColor, fontSize: 14 }}>▾</Text>
      </Pressable>
    </KeyboardAvoidingView>,

    // ── Paso 4: Catálogo ──────────────────────────────────────────────────────
    <View key="step4" style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
      <View style={{ backgroundColor: soft, width: 80, height: 80, borderRadius: 24 }} className="items-center justify-center mb-8">
        <Text style={{ fontSize: 40 }}>🛍️</Text>
      </View>
      <Text style={{ color: contentColor }} className="text-3xl font-bold text-center mb-3">
        {t('onboarding.step4Title')}
      </Text>
      <Text style={{ color: contentMuted }} className="text-base text-center leading-6">
        {t('onboarding.step4Subtitle')}
      </Text>
    </View>,
  ];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>

        {/* Indicadores de paso */}
        <View className="flex-row justify-center gap-2 pt-4 pb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === step ? color : border,
              }}
            />
          ))}
        </View>

        {/* Contenido */}
        <FlatList
          ref={flatListRef}
          data={steps}
          renderItem={({ item }) => item}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        />

        {/* Botones */}
        <View style={{ paddingHorizontal: 32, paddingBottom: insets.bottom + 24, gap: 12 }}>
          {step === 0 && (
            <Pressable
              onPress={() => goToStep(1)}
              style={{ backgroundColor: color }}
              className="rounded-2xl py-4 items-center active:opacity-80"
            >
              <Text className="text-white font-bold text-base">{t('onboarding.step1Button')}</Text>
            </Pressable>
          )}
          {step === 1 && (
            <Pressable
              onPress={() => goToStep(2)}
              style={{ backgroundColor: color }}
              className="rounded-2xl py-4 items-center active:opacity-80"
            >
              <Text className="text-white font-bold text-base">{t('onboarding.step2Button')}</Text>
            </Pressable>
          )}
          {step === 2 && (
            <Pressable
              onPress={handleStep3}
              style={{ backgroundColor: color }}
              className="rounded-2xl py-4 items-center active:opacity-80"
            >
              <Text className="text-white font-bold text-base">{t('onboarding.step3Button')}</Text>
            </Pressable>
          )}
          {step === 3 && (
            <>
              <Pressable
                onPress={() => handleFinish(true)}
                style={{ backgroundColor: color }}
                className="rounded-2xl py-4 items-center active:opacity-80"
              >
                <Text className="text-white font-bold text-base">{t('onboarding.step4Button')}</Text>
              </Pressable>
              <Pressable
                onPress={() => handleFinish(false)}
                className="py-3 items-center active:opacity-60"
              >
                <Text style={{ color: contentMuted }} className="text-base font-medium">{t('onboarding.step4Skip')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Currency picker */}
      <Modal visible={showCurrencyPicker} transparent animationType="slide" onRequestClose={() => setShowCurrencyPicker(false)}>
        <Pressable className="flex-1 bg-black/50" onPress={() => setShowCurrencyPicker(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={{ backgroundColor: bgElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: border, alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />
              <ScrollView style={{ maxHeight: 360 }}>
                {CURRENCY_KEYS.map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => { setCurrency(key); setShowCurrencyPicker(false); }}
                    style={{ borderBottomWidth: 1, borderBottomColor: border }}
                    className="flex-row items-center gap-3 px-5 py-3.5 active:opacity-60"
                  >
                    <Text style={{ color: contentMuted, fontWeight: '700', width: 32, textAlign: 'center' }}>
                      {getCurrencySymbol(key)}
                    </Text>
                    <Text style={{ color: contentColor, flex: 1, fontSize: 15 }}>{key}</Text>
                    {currency === key && <Text style={{ color }}>✓</Text>}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
