import { Text, View } from 'react-native';

interface SummaryCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  accentWarning?: boolean;
}

export function SummaryCard({ label, value, sublabel, accent, accentWarning }: SummaryCardProps) {
  return (
    <View
      className={`flex-1 rounded-2xl p-4 ${
        accent
          ? 'bg-primary'
          : accentWarning
          ? 'bg-warning-soft border border-warning/20'
          : 'bg-surface-elevated border border-border'
      }`}
    >
      <Text
        className={`text-xs font-medium mb-1 uppercase tracking-wider ${
          accent ? 'text-white/70' : accentWarning ? 'text-warning' : 'text-content-muted'
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-xl font-bold ${
          accent ? 'text-white' : accentWarning ? 'text-warning' : 'text-content'
        }`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {sublabel ? (
        <Text
          className={`text-xs mt-0.5 ${
            accent ? 'text-white/60' : accentWarning ? 'text-warning/70' : 'text-content-subtle'
          }`}
        >
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}
