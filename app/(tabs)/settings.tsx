import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CustomToggle } from '@/components/ui/CustomToggle';
import { PALETTES } from '@/constants/palette';
import { getDatabase } from '@/db/database';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useProductsStore } from '@/store/products-store';
import { useUIStore, type AccentPalette } from '@/store/ui-store';

const PALETTE_OPTIONS: { key: AccentPalette; label: string }[] = [
  { key: 'terracota', label: 'Terracota' },
  { key: 'rosa', label: 'Rosa' },
  { key: 'miel', label: 'Miel' },
  { key: 'oliva', label: 'Oliva' },
];

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const { products } = useProductsStore();
  const { colorScheme, toggleColorScheme, accentPalette, setAccentPalette, businessName, setBusinessName } = useUIStore();
  const { color } = useAccentColor();

  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');

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
      'Borrar todos los datos',
      'Se eliminarán pedidos, productos y reportes. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '¿Estás completamente seguro/a?',
              'Toca "Sí, borrar todo" para confirmar definitivamente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sí, borrar todo',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const db = await getDatabase();
                      await db.execAsync(
                        'DELETE FROM order_items; DELETE FROM orders; DELETE FROM products;'
                      );
                      Alert.alert('Listo', 'Todos los datos han sido eliminados.');
                    } catch {
                      Alert.alert('Error', 'No se pudieron eliminar los datos.');
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
    Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
  }

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
        <SettingsGroup title="Apariencia" colorScheme={colorScheme}>
          <SettingsRow
            icon={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'}
            label="Tema oscuro"
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
            <Text className="flex-1 text-base text-content dark:text-content-dark">Color</Text>
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
        <SettingsGroup title="Negocio" colorScheme={colorScheme}>
          <SettingsRow
            icon="person.fill"
            label="Información del negocio"
            chevron
            colorScheme={colorScheme}
            onPress={openNameModal}
            isLast
          />
        </SettingsGroup>

        {/* Datos */}
        <SettingsGroup title="Datos" colorScheme={colorScheme}>
          <SettingsRow
            icon="square.and.arrow.down.fill"
            label="Exportar pedidos"
            chevron
            colorScheme={colorScheme}
            onPress={handleComingSoon}
          />
          <SettingsRow
            icon="doc.on.doc.fill"
            label="Respaldar catálogo"
            chevron
            colorScheme={colorScheme}
            onPress={handleComingSoon}
            isLast
          />
        </SettingsGroup>

        {/* Zona de peligro */}
        <SettingsGroup title="Zona de peligro" colorScheme={colorScheme} danger>
          <Pressable
            onPress={handleDeleteAll}
            className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-60"
          >
            <IconSymbol name="trash.fill" size={20} color={colorScheme === 'dark' ? '#E97864' : '#C24A38'} />
            <Text className="text-base font-medium text-error dark:text-error-dark flex-1">
              Borrar todos los datos
            </Text>
          </Pressable>
        </SettingsGroup>

        <Text className="text-center text-xs text-content-subtle dark:text-content-subtle-dark py-2">
          Kippor · v{version}
        </Text>

      </ScrollView>

      {/* Modal nombre del negocio */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setShowNameModal(false)}
        >
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl px-5 pt-4 pb-10">
              <View className="items-center mb-4">
                <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
              </View>
              <Text className="text-lg font-bold text-content dark:text-content-dark mb-4">
                Nombre del negocio
              </Text>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Ej. Repostería Lucía"
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
                <Text className="text-white font-semibold text-base">Guardar</Text>
              </Pressable>
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
        className={`text-xs font-semibold uppercase tracking-wider px-1 mb-2 ${
          danger
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
      className={`flex-row items-center gap-3 px-4 py-3.5 min-h-[52px] ${
        !isLast ? 'border-b border-border dark:border-border-dark' : ''
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
