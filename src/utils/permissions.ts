import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Linking, Platform } from 'react-native';

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
