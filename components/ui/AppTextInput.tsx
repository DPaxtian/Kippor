import { TextInput, type TextInputProps } from 'react-native';

export function AppTextInput(props: TextInputProps) {
  return <TextInput {...props} style={[{ lineHeight: undefined }, props.style]} />;
}
