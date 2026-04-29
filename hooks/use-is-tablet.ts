import { useWindowDimensions } from 'react-native';

/** iPad and large tablets: width >= 768px */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}
