import { router } from 'expo-router';
import { CustomToggle } from '@/components/ui/CustomToggle';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PALETTES } from '@/constants/palette';
import { getDatabase } from '@/db/database';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useLabelsStore } from '@/store/labels-store';
import { useProductsStore } from '@/store/products-store';
import { useUIStore, type AccentPalette, type CurrencyCode } from '@/store/ui-store';
import { getCurrencySymbol } from '@/utils/format';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { ExportModal } from '@/components/ui/ExportModal';
import { ModalHandle } from '@/components/ui/ModalHandle';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  cancelEveningNotification,
  cancelMorningNotification,
  requestNotificationPermissions,
  scheduleEveningNotification,
  scheduleMorningNotification,
} from '@/utils/notifications';

const PALETTE_OPTIONS: { key: AccentPalette; label: string }[] = [
  { key: 'terracota', label: 'Terracota' },
  { key: 'rosa', label: 'Rosa' },
  { key: 'miel', label: 'Miel' },
  { key: 'oliva', label: 'Oliva' },
];

const CURRENCY_KEYS = ['MXN', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'PEN', 'GTQ', 'CRC'] as CurrencyCode[];

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  useProductsStore();
  const {
    colorScheme, toggleColorScheme, accentPalette, setAccentPalette,
    businessName, setBusinessName, currency, setCurrency,
    morningNotificationEnabled, morningNotificationTime, setMorningNotification,
    eveningNotificationEnabled, eveningNotificationTime, setEveningNotification,
    language, setLanguage,
  } = useUIStore();
  const { labels, fetchLabels } = useLabelsStore();
  const { color } = useAccentColor();
  const { t } = useTranslation();

  const [showNameModal, setShowNameModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);
  const [nameInput, setNameInput] = useState('');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  function openNameModal() {
    setNameInput(businessName);
    setShowNameModal(true);
  }

  function saveBusinessName() {
    const trimmed = nameInput.trim();
    if (trimmed) setBusinessName(trimmed);
    setShowNameModal(false);
  }

  function handleDeleteAll() {
    Alert.alert(
      t('settings.deleteAllTitle'),
      t('settings.deleteAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.deleteAllConfirmTitle'),
              t('settings.deleteAllConfirmMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.deleteAllConfirm'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const db = await getDatabase();
                      await db.execAsync(
                        'DELETE FROM order_items; DELETE FROM orders; DELETE FROM products;'
                      );
                      Alert.alert(t('common.success'), t('settings.deleteAllSuccess'));
                    } catch {
                      Alert.alert(t('common.error'), t('settings.deleteAllError'));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  function handleComingSoon() {
    Alert.alert(t('common.soon'), t('common.soonMessage'));
  }

  const LANGUAGE_LABELS: Record<AppLanguage, string> = {
    es: t('languages.es'),
    en: t('languages.en'),
    pt: t('languages.pt'),
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4 gap-4 pb-8">

        {/* Profile header */}
        <View className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl p-4 flex-row items-center gap-4">
          <View style={{ backgroundColor: color }} className="w-14 h-14 rounded-2xl items-center justify-center flex-shrink-0">
            <Text className="text-white text-2xl font-bold">
              {businessName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-content dark:text-content-dark">{businessName}</Text>
          </View>
        </View>

        {/* Apariencia */}
        <SettingsGroup title={t('settings.sectionAppearance')} colorScheme={colorScheme}>
          <SettingsRow
            icon={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'}
            label={t('settings.darkMode')}
            colorScheme={colorScheme}
            right={
              <CustomToggle
                value={colorScheme === 'dark'}
                onValueChange={toggleColorScheme}
              />
            }
          />
          {/* Color accent selector */}
          <View className={`flex-row items-center gap-3 px-4 py-3.5 min-h-[52px]`}>
            <IconSymbol name="paintpalette.fill" size={20} color={colorScheme === 'dark' ? '#7A6E66' : '#9A8A80'} />
            <Text className="flex-1 text-base text-content dark:text-content-dark">{t('settings.accentColor')}</Text>
            <View className="flex-row gap-2.5">
              {PALETTE_OPTIONS.map(({ key }) => {
                const p = PALETTES[key];
                const dotColor = colorScheme === 'dark' ? p.primaryDark : p.primary;
                const isSelected = accentPalette === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setAccentPalette(key)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: dotColor,
                      borderWidth: isSelected ? 2.5 : 0,
                      borderColor: colorScheme === 'dark' ? '#F4EDE7' : '#1F1815',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                );
              })}
            </View>
          </View>
        </SettingsGroup>

        {/* Negocio */}
        <SettingsGroup title={t('settings.sectionBusiness')} colorScheme={colorScheme}>
          <SettingsRow
            icon="person.fill"
            label={t('settings.businessInfo')}
            chevron
            colorScheme={colorScheme}
            onPress={openNameModal}
          />
          <SettingsRow
            icon="dollarsign.circle.fill"
            label={t('settings.currency')}
            chevron
            colorScheme={colorScheme}
            onPress={() => setShowCurrencyModal(true)}
            right={
              <Text className="text-sm text-content-muted dark:text-content-muted-dark mr-1">
                {getCurrencySymbol(currency)} {currency}
              </Text>
            }
          />
          <SettingsRow
            icon="tag.fill"
            label={t('settings.labelsRow')}
            chevron
            colorScheme={colorScheme}
            onPress={() => router.push('/labels')}
            right={
              <Text className="text-sm text-content-muted dark:text-content-muted-dark mr-1">
                {labels.length}
              </Text>
            }
          />
          <SettingsRow
            icon="globe"
            label={t('settings.language')}
            chevron
            colorScheme={colorScheme}
            onPress={() => setShowLanguageModal(true)}
            isLast
            right={
              <Text className="text-sm text-content-muted dark:text-content-muted-dark mr-1">
                {LANGUAGE_LABELS[language]}
              </Text>
            }
          />
        </SettingsGroup>

        {/* Notificaciones */}
        <SettingsGroup title={t('settings.sectionNotifications')} colorScheme={colorScheme}>
          <View className="px-4 py-3.5 border-b border-border dark:border-border-dark gap-2">
            <View className="flex-row items-center gap-3">
              <IconSymbol name="sun.max.fill" size={20} color={colorScheme === 'dark' ? '#7A6E66' : '#9A8A80'} />
              <Text className="flex-1 text-base text-content dark:text-content-dark">{t('settings.morningNotification')}</Text>
              <CustomToggle
                value={morningNotificationEnabled}
                onValueChange={async (v) => {
                  const granted = await requestNotificationPermissions();
                  if (!granted) { Alert.alert(t('common.error'), t('settings.notificationPermission')); return; }
                  setMorningNotification(v);
                  if (v) await scheduleMorningNotification(morningNotificationTime.hour, morningNotificationTime.minute);
                  else await cancelMorningNotification();
                }}
              />
            </View>
            {morningNotificationEnabled && (
              <Pressable onPress={() => setShowMorningPicker(true)} className="flex-row items-center justify-between bg-surface-muted dark:bg-surface-muted-dark rounded-xl px-3 py-2 active:opacity-70">
                <Text className="text-sm text-content-muted dark:text-content-muted-dark">{t('settings.notificationTime')}</Text>
                <Text style={{ color }} className="text-sm font-semibold">
                  {String(morningNotificationTime.hour).padStart(2, '0')}:{String(morningNotificationTime.minute).padStart(2, '0')}
                </Text>
              </Pressable>
            )}
          </View>
          <View className="px-4 py-3.5 gap-2">
            <View className="flex-row items-center gap-3">
              <IconSymbol name="moon.fill" size={20} color={colorScheme === 'dark' ? '#7A6E66' : '#9A8A80'} />
              <Text className="flex-1 text-base text-content dark:text-content-dark">{t('settings.eveningNotification')}</Text>
              <CustomToggle
                value={eveningNotificationEnabled}
                onValueChange={async (v) => {
                  const granted = await requestNotificationPermissions();
                  if (!granted) { Alert.alert(t('common.error'), t('settings.notificationPermission')); return; }
                  setEveningNotification(v);
                  if (v) await scheduleEveningNotification(eveningNotificationTime.hour, eveningNotificationTime.minute, currency);
                  else await cancelEveningNotification();
                }}
              />
            </View>
            {eveningNotificationEnabled && (
              <Pressable onPress={() => setShowEveningPicker(true)} className="flex-row items-center justify-between bg-surface-muted dark:bg-surface-muted-dark rounded-xl px-3 py-2 active:opacity-70">
                <Text className="text-sm text-content-muted dark:text-content-muted-dark">{t('settings.notificationTime')}</Text>
                <Text style={{ color }} className="text-sm font-semibold">
                  {String(eveningNotificationTime.hour).padStart(2, '0')}:{String(eveningNotificationTime.minute).padStart(2, '0')}
                </Text>
              </Pressable>
            )}
          </View>
        </SettingsGroup>

        {/* Datos */}
        <SettingsGroup title={t('settings.sectionData')} colorScheme={colorScheme}>
          <SettingsRow
            icon="square.and.arrow.down.fill"
            label={t('settings.exportOrders')}
            chevron
            colorScheme={colorScheme}
            onPress={() => setShowExportModal(true)}
          />
          <SettingsRow
            icon="doc.on.doc.fill"
            label={t('settings.backupCatalog')}
            chevron
            colorScheme={colorScheme}
            onPress={handleComingSoon}
            isLast
          />
        </SettingsGroup>

        {/* Zona de peligro */}
        <SettingsGroup title={t('settings.sectionDanger')} colorScheme={colorScheme} danger>
          <Pressable
            onPress={handleDeleteAll}
            className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-60"
          >
            <IconSymbol name="trash.fill" size={20} color={colorScheme === 'dark' ? '#E97864' : '#C24A38'} />
            <Text className="text-base font-medium text-error dark:text-error-dark flex-1">
              {t('settings.deleteAll')}
            </Text>
          </Pressable>
        </SettingsGroup>

        <Text className="text-center text-xs text-content-subtle dark:text-content-subtle-dark py-2">
          {t('settings.version', { version })}
        </Text>

      </ScrollView>

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* Time picker matutino */}
      {showMorningPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowMorningPicker(false)}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowMorningPicker(false)}>
            <View className="flex-1" />
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl px-5 pt-4 pb-10">
                <ModalHandle onClose={() => setShowMorningPicker(false)} />
                <Text className="text-lg font-bold text-content dark:text-content-dark mb-2">{t('settings.morningPickerTitle')}</Text>
                <DateTimePicker
                  value={new Date(2000, 0, 1, morningNotificationTime.hour, morningNotificationTime.minute)}
                  mode="time"
                  display="spinner"
                  onChange={async (_, date) => {
                    if (!date) return;
                    const time = { hour: date.getHours(), minute: date.getMinutes() };
                    setMorningNotification(true, time);
                    await scheduleMorningNotification(time.hour, time.minute);
                  }}
                  style={{ height: 150 }}
                />
                <Pressable onPress={() => setShowMorningPicker(false)} style={{ backgroundColor: color }} className="rounded-xl py-4 items-center mt-2 active:opacity-80">
                  <Text className="text-white font-semibold text-base">{t('common.done')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Time picker nocturno */}
      {showEveningPicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowEveningPicker(false)}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowEveningPicker(false)}>
            <View className="flex-1" />
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl px-5 pt-4 pb-10">
                <ModalHandle onClose={() => setShowEveningPicker(false)} />
                <Text className="text-lg font-bold text-content dark:text-content-dark mb-2">{t('settings.eveningPickerTitle')}</Text>
                <DateTimePicker
                  value={new Date(2000, 0, 1, eveningNotificationTime.hour, eveningNotificationTime.minute)}
                  mode="time"
                  display="spinner"
                  onChange={async (_, date) => {
                    if (!date) return;
                    const time = { hour: date.getHours(), minute: date.getMinutes() };
                    setEveningNotification(true, time);
                    await scheduleEveningNotification(time.hour, time.minute, currency);
                  }}
                  style={{ height: 150 }}
                />
                <Pressable onPress={() => setShowEveningPicker(false)} style={{ backgroundColor: color }} className="rounded-xl py-4 items-center mt-2 active:opacity-80">
                  <Text className="text-white font-semibold text-base">{t('common.done')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Modal nombre del negocio */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowNameModal(false)}>
          <View className="flex-1" />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl px-5 pt-4 pb-10">
                <ModalHandle onClose={() => setShowNameModal(false)} />
                <Text className="text-lg font-bold text-content dark:text-content-dark mb-4">
                  {t('settings.businessNameTitle')}
                </Text>
                <AppTextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder={t('settings.businessNamePlaceholder')}
                  placeholderTextColor="#9A8A80"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveBusinessName}
                  className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-base text-content dark:text-content-dark mb-4"
                />
                <Pressable
                  onPress={saveBusinessName}
                  style={{ backgroundColor: color }}
                  className="rounded-xl py-4 items-center active:opacity-80"
                >
                  <Text className="text-white font-semibold text-base">{t('common.save')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
      {/* Modal moneda */}
      <Modal visible={showCurrencyModal} transparent animationType="slide" onRequestClose={() => setShowCurrencyModal(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowCurrencyModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-10">
              <ModalHandle onClose={() => setShowCurrencyModal(false)} />
              <Text className="text-lg font-bold text-content dark:text-content-dark px-5 py-3">{t('settings.currencyTitle')}</Text>
              <ScrollView style={{ maxHeight: 380 }}>
                {CURRENCY_KEYS.map((key) => {
                  const isSelected = currency === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => { setCurrency(key); setShowCurrencyModal(false); }}
                      className="flex-row items-center gap-3 px-5 py-3.5 border-b border-border dark:border-border-dark active:opacity-60"
                    >
                      <View className="w-10 items-center">
                        <Text className="text-base font-bold text-content-muted dark:text-content-muted-dark">
                          {getCurrencySymbol(key)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base text-content dark:text-content-dark">{t(`currencies.${key}`)}</Text>
                        <Text className="text-xs text-content-muted dark:text-content-muted-dark">{t(`countries.${key}`)} · {key}</Text>
                      </View>
                      {isSelected && <IconSymbol name="checkmark" size={16} color={color} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal idioma */}
      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowLanguageModal(false)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-10">
              <ModalHandle onClose={() => setShowLanguageModal(false)} />
              <Text className="text-lg font-bold text-content dark:text-content-dark px-5 py-3">{t('languages.title')}</Text>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => { setLanguage(lang); setShowLanguageModal(false); }}
                    className="flex-row items-center gap-3 px-5 py-3.5 border-b border-border dark:border-border-dark active:opacity-60"
                  >
                    <Text className="flex-1 text-base text-content dark:text-content-dark">{LANGUAGE_LABELS[lang]}</Text>
                    {isSelected && <IconSymbol name="checkmark" size={16} color={color} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsGroup({
  title,
  children,
  danger,
  colorScheme,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  colorScheme: string;
}) {
  return (
    <View>
      <Text
        className={`text-xs font-semibold uppercase tracking-wider px-1 mb-2 ${danger
          ? 'text-error dark:text-error-dark'
          : 'text-content-muted dark:text-content-muted-dark'
          }`}
      >
        {title}
      </Text>
      <View className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  right,
  chevron,
  onPress,
  isLast,
  colorScheme,
}: {
  icon: string;
  label: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  colorScheme: string;
}) {
  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';

  const Inner = (
    <View
      className={`flex-row items-center gap-3 px-4 py-3.5 min-h-[52px] ${!isLast ? 'border-b border-border dark:border-border-dark' : ''
        }`}
    >
      <IconSymbol name={icon as any} size={20} color={iconColor} />
      <Text className="flex-1 text-base text-content dark:text-content-dark">{label}</Text>
      {right}
      {chevron && (
        <IconSymbol name="chevron.right" size={16} color={iconColor} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-60">
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}
