import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { CameraCapture } from '../../src/components/import/CameraCapture';
import { PhotoPreview } from '../../src/components/import/PhotoPreview';
import { PhotoEditor } from '../../src/components/import/PhotoEditor';
import { PhotoUploadProgress } from '../../src/components/import/PhotoUploadProgress';
import { useImportStore } from '../../src/stores/importStore';
import { uploadPhoto, uploadPhotos } from '../../src/services/photoUpload';
import { compressImage } from '../../src/utils/imageCompression';
import { requestMediaLibraryPermission } from '../../src/utils/permissions';
import { usePhotoBatch, MAX_PHOTOS } from '../../src/hooks/usePhotoBatch';
import { colors } from '../../src/theme';

type PhotoSource = 'camera' | 'gallery';
type ScreenState = 'camera' | 'preview' | 'editor' | 'uploading';

export default function PhotoImportScreen() {
  const params = useLocalSearchParams<{ source?: string }>();
  const source: PhotoSource = (params.source as PhotoSource) || 'camera';

  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(source === 'gallery');
  const [addingMore, setAddingMore] = useState(false);

  const batch = usePhotoBatch();

  const addJob = useImportStore((state) => state.addJob);
  const jobs = useImportStore((state) => state.jobs);

  // Launch gallery picker if source is gallery
  useEffect(() => {
    if (source === 'gallery') {
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

      const selectionLimit = addingMore ? batch.remainingSlots : MAX_PHOTOS;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: addingMore || source === 'gallery',
        selectionLimit,
        quality: 1,
      });

      if (result.canceled) {
        if (addingMore) {
          setAddingMore(false);
          setScreenState('editor');
        } else {
          router.back();
        }
        return;
      }

      if (addingMore) {
        // Adding more photos to existing batch
        const uris = result.assets.map((a) => a.uri);
        batch.addPhotos(uris);
        setAddingMore(false);
        setScreenState('editor');
      } else if (result.assets.length > 1) {
        // Initial multi-select from gallery
        const uris = result.assets.map((a) => a.uri);
        batch.addPhotos(uris);
        setIsLoadingGallery(false);
        setScreenState('editor');
      } else {
        // Single photo selected — show preview
        const asset = result.assets[0];
        setPendingPhotoUri(asset.uri);
        setIsLoadingGallery(false);
        setScreenState('preview');
      }
    } catch (error) {
      console.error('Gallery pick error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger la photo',
      });
      setIsLoadingGallery(false);
      if (addingMore) {
        setAddingMore(false);
        setScreenState('editor');
      } else {
        router.back();
      }
    }
  };

  const handleCapture = useCallback((uri: string) => {
    setPendingPhotoUri(uri);
    setScreenState('preview');
  }, []);

  const handleRetake = useCallback(() => {
    setPendingPhotoUri(null);
    if (source === 'gallery' && !addingMore) {
      handleGalleryPick();
    } else {
      setScreenState('camera');
    }
  }, [source, addingMore]);

  const handleUsePhoto = useCallback(() => {
    if (pendingPhotoUri) {
      batch.addPhoto(pendingPhotoUri);
      setPendingPhotoUri(null);
      setScreenState('editor');
    }
  }, [pendingPhotoUri, batch]);

  const handleAddMore = useCallback((addSource: 'camera' | 'gallery') => {
    setAddingMore(true);
    if (addSource === 'camera') {
      setScreenState('camera');
    } else {
      handleGalleryPick();
    }
  }, []);

  const handleEditComplete = useCallback(async () => {
    const uris = batch.photos.map((p) => p.uri);
    if (uris.length === 0) return;

    if (uris.length === 1) {
      await startUpload(uris[0]);
    } else {
      await startBatchUpload(uris);
    }
  }, [batch.photos]);

  const startUpload = async (uri: string) => {
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
      const compressed = await compressImage(uri);

      const response = await uploadPhoto(compressed.uri, (progress) => {
        setUploadProgress(progress.percentage);
      });

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

  const startBatchUpload = async (uris: string[]) => {
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
      // Compress all images
      const compressed = await Promise.all(uris.map((uri) => compressImage(uri)));
      const compressedUris = compressed.map((c) => c.uri);

      const response = await uploadPhotos(compressedUris, (progress) => {
        setUploadProgress(progress.percentage);
      });

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
        text1: `${uris.length} photos envoyees`,
        text2: 'Suivez la progression sur la page principale',
      });

      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi";
      setUploadError(errorMessage);
    }
  };

  const handleRetryUpload = useCallback(() => {
    const uris = batch.photos.map((p) => p.uri);
    if (uris.length === 1) {
      startUpload(uris[0]);
    } else if (uris.length > 1) {
      startBatchUpload(uris);
    }
  }, [batch.photos]);

  const handleCancelUpload = useCallback(() => {
    router.back();
  }, []);

  const handleCameraCancel = useCallback(() => {
    if (addingMore) {
      setAddingMore(false);
      setScreenState('editor');
    } else {
      router.back();
    }
  }, [addingMore]);

  const showEditor = screenState === 'editor' && batch.photos.length > 0;

  const renderContent = () => {
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

    if (showEditor) {
      return (
        <PhotoEditor
          uri={batch.activePhoto!.uri}
          photos={batch.photos}
          activeIndex={batch.activeIndex}
          canAddMore={batch.canAddMore}
          onComplete={handleEditComplete}
          onSelectPhoto={batch.selectPhoto}
          onRemovePhoto={batch.removePhoto}
          onReorderPhotos={batch.reorderPhotos}
          onAddMore={handleAddMore}
        />
      );
    }

    if (screenState === 'preview' && pendingPhotoUri) {
      return (
        <PhotoPreview uri={pendingPhotoUri} onRetake={handleRetake} onUsePhoto={handleUsePhoto} />
      );
    }

    if (screenState === 'camera') {
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
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: showEditor,
          title: '',
        }}
      />
      {renderContent()}
    </>
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
