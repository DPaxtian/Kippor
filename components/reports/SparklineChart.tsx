import { Text, View } from 'react-native';

interface SparklineChartProps {
  data: number[];
  labels: string[];
}

export function SparklineChart({ data, labels }: SparklineChartProps) {
  const MAX_BAR_HEIGHT = 48;
  const max = Math.max(...data, 1);

  return (
    <View>
      <View
        style={{ height: MAX_BAR_HEIGHT + 4 }}
        className="flex-row items-end gap-0.5"
      >
        {data.map((value, i) => {
          const height = Math.max(4, (value / max) * MAX_BAR_HEIGHT);
          return (
            <View key={i} className="flex-1 items-center justify-end" style={{ height: MAX_BAR_HEIGHT }}>
              <View
                style={{ height, borderRadius: 3 }}
                className="w-full bg-white/40"
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row mt-1">
        {labels.map((label, i) => (
          <Text key={i} className="flex-1 text-center text-white/60 text-xs">
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
