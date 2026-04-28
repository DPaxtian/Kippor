import { useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LabelEditor } from '@/components/labels/LabelEditor';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useLabelsStore } from '@/store/labels-store';

export default function LabelsScreen() {
  const { fetchLabels } = useLabelsStore();
  const { color } = useAccentColor();
  const navigation = useNavigation();
  const [triggerNew, setTriggerNew] = useState(0);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setTriggerNew((n) => n + 1)} className="px-1 active:opacity-60">
          <Text style={{ color }} className="text-base font-medium">Nueva</Text>
        </Pressable>
      ),
    });
  }, [navigation, color]);

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView>
        <LabelEditor triggerNew={triggerNew} />
      </ScrollView>
    </SafeAreaView>
  );
}
