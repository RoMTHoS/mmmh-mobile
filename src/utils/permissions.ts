import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Error messages in French for permission denials
 */
export const PERMISSION_MESSAGES = {
  camera: {
    title: 'Acces a la camera refuse',
    message: "Pour prendre des photos, autorisez l'acces a la camera dans les parametres.",
  },
  mediaLibrary: {
    title: 'Acces aux photos refuse',
    message: "Pour choisir des photos, autorisez l'acces a la galerie dans les parametres.",
  },
} as const;

/**
 * Opens the device settings app
 */
export async function openSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
}

/**
 * Requests camera permission and returns whether it was granted
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Requests media library permission and returns whether it was granted
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Shows an alert for denied camera permission with option to open settings
 */
export function showCameraPermissionDeniedAlert(onCancel?: () => void): void {
  Alert.alert(PERMISSION_MESSAGES.camera.title, PERMISSION_MESSAGES.camera.message, [
    { text: 'Annuler', style: 'cancel', onPress: onCancel },
    { text: 'Parametres', onPress: openSettings },
  ]);
}

/**
 * Shows an alert for denied media library permission with option to open settings
 */
export function showMediaLibraryPermissionDeniedAlert(onCancel?: () => void): void {
  Alert.alert(PERMISSION_MESSAGES.mediaLibrary.title, PERMISSION_MESSAGES.mediaLibrary.message, [
    { text: 'Annuler', style: 'cancel', onPress: onCancel },
    { text: 'Parametres', onPress: openSettings },
  ]);
}
