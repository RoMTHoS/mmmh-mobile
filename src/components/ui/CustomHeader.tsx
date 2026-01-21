import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../../theme';

interface HeaderAction {
  label?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

interface CustomHeaderProps {
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
  title?: string;
}

export function CustomHeader({ leftAction, rightAction, title }: CustomHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.side}>
          {leftAction && (
            <Pressable
              onPress={leftAction.onPress}
              disabled={leftAction.disabled}
              hitSlop={8}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              {leftAction.icon}
              {leftAction.label && (
                <Text style={[styles.actionText, leftAction.disabled && styles.actionDisabled]}>
                  {leftAction.label}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {title && <Text style={styles.title}>{title}</Text>}

        <View style={[styles.side, styles.rightSide]}>
          {rightAction && (
            <Pressable
              onPress={rightAction.onPress}
              disabled={rightAction.disabled}
              hitSlop={8}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              {rightAction.icon}
              {rightAction.label && (
                <Text style={[styles.actionText, rightAction.disabled && styles.actionDisabled]}>
                  {rightAction.label}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
  title: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontFamily: fonts.script,
    fontSize: 18,
    color: colors.text,
  },
  actionDisabled: {
    opacity: 0.5,
  },
});
