import { View, TextInput, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, spacing, radius, fonts } from '../../theme';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  useScriptPlaceholder?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher',
  useScriptPlaceholder = true,
  onFocus,
  onBlur,
  style,
  autoFocus = false,
}: Props) {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={[styles.container, style]}>
      <Icon name="search" size="sm" color={colors.textMuted} />
      <TextInput
        style={[styles.input, useScriptPlaceholder && styles.scriptInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Rechercher des recettes"
        accessibilityRole="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Effacer la recherche"
          accessibilityRole="button"
        >
          <Icon name="plus" size="sm" color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  scriptInput: {
    fontFamily: fonts.script,
  },
});
