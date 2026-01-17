import { Text as RNText, StyleSheet, TextProps, StyleProp, TextStyle } from 'react-native';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function Text({ variant = 'body', color, style, children, ...props }: Props) {
  return (
    <RNText style={[styles[variant], color ? { color } : undefined, style]} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
  },
});
