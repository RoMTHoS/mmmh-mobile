import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { CameraCapture } from '../../src/components/import/CameraCapture';
import { PhotoPreview } from '../../src/components/import/PhotoPreview';
import { PhotoEditor } from '../../src/components/import/PhotoEditor';
import { PhotoUploadProgress } from '../../src/components/import/PhotoUploadProgress';
import { useImportStore } from '../../src/stores/importStore';
import { uploadPhoto } from '../../src/services/photoUpload';
import { compressImage } from '../../src/utils/imageCompression';
import { requestMediaLibraryPermission } from '../../src/utils/permissions';
import { colors } from '../../src/theme';

type PhotoSource = 'camera' | 'gallery';
type ScreenState = 'camera' | 'preview' | 'editor' | 'uploading';

export default function PhotoImportScreen() {
  const params = useLocalSearchParams<{ source?: string }>();
  const source: PhotoSource = (params.source as PhotoSource) || 'camera';

  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editedUri, setEditedUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(source === 'gallery');

  const addJob = useImportStore((state) => state.addJob);
  const jobs = useImportStore((state) => state.jobs);

  // Launch gallery picker if source is gallery
  useEffect(() => {
    if (source === 'gallery') {
      // Small delay to ensure screen is mounted before launching picker
      const timer = setTimeout(() => {
        handleGalleryPick();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [source]);

  const handleGalleryPick = async () => {
    setIsLoadingGallery(true);

    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission requise',
          'Acces aux photos refuse. Activez-le dans les parametres.',
          [
            { text: 'Annuler', onPress: () => router.back() },
            { text: 'Parametres', onPress: () => router.back() },
          ]
        );
        setIsLoadingGallery(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        router.back();
        return;
      }

      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setIsLoadingGallery(false);
      setScreenState('preview');
    } catch (error) {
      console.error('Gallery pick error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger la photo',
      });
      setIsLoadingGallery(false);
      router.back();
    }
  };

  const handleCapture = useCallback((uri: string) => {
    setPhotoUri(uri);
    setScreenState('preview');
  }, []);

  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setEditedUri(null);
    if (source === 'gallery') {
      handleGalleryPick();
    } else {
      setScreenState('camera');
    }
  }, [source]);

  const handleUsePhoto = useCallback(() => {
    setScreenState('editor');
  }, []);

  const handleSkipEdit = useCallback(async () => {
    await startUpload(photoUri!);
  }, [photoUri]);

  const handleEditComplete = useCallback(async (uri: string) => {
    setEditedUri(uri);
    await startUpload(uri);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setScreenState('preview');
  }, []);

  const startUpload = async (uri: string) => {
    // Check if we already have max jobs
    const activeJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
    if (activeJobs.length >= 3) {
      Toast.show({
        type: 'error',
        text1: 'Limite atteinte',
        text2: 'Vous avez deja 3 imports en cours',
      });
      return;
    }

    setScreenState('uploading');
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Compress image before upload
      const compressed = await compressImage(uri);

      // Upload photo
      const response = await uploadPhoto(compressed.uri, (progress) => {
        setUploadProgress(progress.percentage);
      });

      // Add job to store
      addJob({
        jobId: response.jobId,
        importType: 'photo',
        sourceUrl: `photo://${response.jobId}`,
        platform: 'photo',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      });

      Toast.show({
        type: 'success',
        text1: 'Photo envoyee',
        text2: 'Suivez la progression sur la page principale',
      });

      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi";
      setUploadError(errorMessage);
    }
  };

  const handleRetryUpload = useCallback(() => {
    const uriToUpload = editedUri || photoUri;
    if (uriToUpload) {
      startUpload(uriToUpload);
    }
  }, [editedUri, photoUri]);

  const handleCancelUpload = useCallback(() => {
    router.back();
  }, []);

  const handleCameraCancel = useCallback(() => {
    router.back();
  }, []);

  if (screenState === 'uploading') {
    return (
      <PhotoUploadProgress
        progress={uploadProgress}
        error={uploadError}
        onRetry={handleRetryUpload}
        onCancel={handleCancelUpload}
      />
    );
  }

  if (screenState === 'editor' && photoUri) {
    return (
      <PhotoEditor
        uri={photoUri}
        onComplete={handleEditComplete}
        onSkip={handleSkipEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  if (screenState === 'preview' && photoUri) {
    return <PhotoPreview uri={photoUri} onRetake={handleRetake} onUsePhoto={handleUsePhoto} />;
  }

  // Camera capture screen
  if (source === 'camera') {
    return <CameraCapture onCapture={handleCapture} onCancel={handleCameraCancel} />;
  }

  // Gallery source - loading state while picker opens
  return (
    <View style={styles.container}>
      {isLoadingGallery && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Ouverture de la galerie...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
});
