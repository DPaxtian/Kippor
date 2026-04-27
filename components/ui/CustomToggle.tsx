import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function CustomToggle({ value, onValueChange }: CustomToggleProps) {
  const translateX = useSharedValue(value ? 22 : 2);

  useEffect(() => {
    translateX.value = withTiming(value ? 22 : 2, { duration: 180 });
  }, [value, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? '#4F8F5C' : '#9A8A80',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}
