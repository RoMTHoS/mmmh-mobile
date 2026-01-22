import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="import" />
      <Stack.Screen name="quick-preview" />
    </Stack>
  );
}
