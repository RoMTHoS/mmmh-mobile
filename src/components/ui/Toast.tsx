import { useEffect, useCallback, useRef } from 'react';
import { Text, Pressable, StyleSheet, AccessibilityInfo, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors, spacing, radius } from '../../theme';
import type { ToastItem } from '../../stores/toastStore';
import { useToastStore } from '../../stores/toastStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ToastProps {
  toast: ToastItem;
}

const TOAST_COLORS = {
  success: colors.success,
  error: colors.error,
  info: colors.accent,
} as const;

const TOAST_ICONS = {
  success: 'check' as const,
  error: 'close' as const,
  info: 'info' as const,
};

function ToastComponent({ toast }: ToastProps) {
  const dismissToast = useToastStore((s) => s.dismissToast);
  const reducedMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : -100)).current;

  const dismiss = useCallback(() => {
    dismissToast(toast.id);
  }, [dismissToast, toast.id]);

  const animateOut = useCallback(() => {
    if (reducedMotion) {
      dismiss();
      return;
    }
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => dismiss());
  }, [translateY, dismiss, reducedMotion]);

  useEffect(() => {
    if (!reducedMotion) {
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        mass: 1,
        useNativeDriver: true,
      }).start();
    }

    const timer = setTimeout(() => {
      animateOut();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [translateY, toast.duration, animateOut, reducedMotion]);

  const bgColor = TOAST_COLORS[toast.type];
  const iconName = TOAST_ICONS[toast.type];

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: bgColor, transform: [{ translateY }] }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={toast.message}
    >
      <Icon name={iconName} size="sm" color="#FFFFFF" />
      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>
      <Pressable
        onPress={animateOut}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      >
        <Icon name="close" size="sm" color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider() {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((s) => s.toasts);

  useEffect(() => {
    if (toasts.length > 0) {
      AccessibilityInfo.announceForAccessibility(toasts[toasts.length - 1].message);
    }
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
  },
});
