import { useRef } from 'react';
import { PanResponder, View } from 'react-native';

interface ModalHandleProps {
  onClose: () => void;
  /** Minimum downward drag in px to trigger close (default 60) */
  threshold?: number;
}

export function ModalHandle({ onClose, threshold = 60 }: ModalHandleProps) {
  const dragY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { dragY.current = 0; },
      onPanResponderMove: (_, gs) => { dragY.current = gs.dy; },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > threshold || gs.vy > 0.5) {
          onClose();
        }
      },
    })
  ).current;

  return (
    <View className="items-center pt-3 pb-1" {...panResponder.panHandlers}>
      <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
    </View>
  );
}
