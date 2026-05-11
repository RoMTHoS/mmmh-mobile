declare module 'react-native-reanimated' {
  import { ComponentType } from 'react';

  export function useSharedValue<T>(initialValue: T): { value: T };
  export function useAnimatedStyle(updater: () => Record<string, unknown>): Record<string, unknown>;
  export function withSpring(toValue: number, config?: Record<string, unknown>): number;
  export function withTiming(
    toValue: number,
    config?: Record<string, unknown>,
    callback?: (finished: boolean) => void
  ): number;
  export function withRepeat(animation: number, numberOfReps?: number, reverse?: boolean): number;
  export function cancelAnimation(sharedValue: { value: unknown }): void;
  export function runOnJS<T extends (...args: unknown[]) => unknown>(fn: T): T;

  export const Easing: {
    ease: string;
    inOut: (easing: string) => string;
  };

  const Animated: {
    View: ComponentType<Record<string, unknown>>;
    Text: ComponentType<Record<string, unknown>>;
  };

  export default Animated;
}
