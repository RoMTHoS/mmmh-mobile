import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui';
import { colors, spacing, radius, fonts } from '../../theme';

interface CameraCaptureProps {
  onCapture: (uri: string) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez reessayer.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Chargement...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <View style={styles.permissionContent}>
          <Icon name="camera" size={48} color={colors.text} />
          <Text style={styles.permissionTitle}>Acces a la camera requis</Text>
          <Text style={styles.permissionText}>
            Pour prendre des photos de vos recettes, autorisez l&apos;acces a la camera.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && styles.permissionButtonPressed,
            ]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Autoriser l&apos;acces</Text>
          </Pressable>
          <Pressable style={styles.cancelLink} onPress={onCancel}>
            <Text style={styles.cancelLinkText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash}>
        {/* Top controls */}
        <View style={[styles.topControls, { paddingTop: insets.top + spacing.md }]}>
          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            onPress={onCancel}
          >
            <Icon name="close" size="lg" color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            onPress={toggleFlash}
          >
            <Icon
              name={flash === 'on' ? 'alert' : 'alert'}
              size="lg"
              color={flash === 'on' ? '#FFD700' : '#FFFFFF'}
            />
            <Text style={styles.flashText}>{flash === 'on' ? 'ON' : 'OFF'}</Text>
          </Pressable>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.controlsRow}>
            {/* Placeholder for symmetry */}
            <View style={styles.sideButtonPlaceholder} />

            {/* Capture button */}
            <Pressable
              style={({ pressed }) => [
                styles.captureButton,
                pressed && styles.captureButtonPressed,
                isCapturing && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </Pressable>

            {/* Flip camera button */}
            <Pressable
              style={({ pressed }) => [styles.flipButton, pressed && styles.controlButtonPressed]}
              onPress={toggleFacing}
            >
              <Icon name="refresh" size="lg" color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.hint}>Positionnez la recette dans le cadre</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  permissionContent: {
    alignItems: 'center',
    padding: spacing.xl,
    maxWidth: 300,
  },
  permissionTitle: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  permissionButtonPressed: {
    opacity: 0.8,
  },
  permissionButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: '#FFFFFF',
  },
  cancelLink: {
    padding: spacing.sm,
  },
  cancelLinkText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.textMuted,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  flashText: {
    fontFamily: fonts.script,
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  sideButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  captureButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
