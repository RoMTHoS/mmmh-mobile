import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMemo, useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../src/hooks';
import { Icon, MmmhLogo } from '../../src/components/ui';
import { CollectionSection } from '../../src/components/collections';
import { useCollectionStore } from '../../src/stores/collectionStore';

import { RecipeGridSkeleton } from '../../src/components/recipes/RecipeGridSkeleton';
import { colors, typography, fonts, spacing, radius } from '../../src/theme';
import type { Recipe } from '../../src/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Logo area ~70, tab bar ~85, 3 section titles (24+margins) ~100, padding ~30
const FIXED_OVERHEAD = 285;

function NewRecipeCard({ recipe, cardHeight }: { recipe: Recipe; cardHeight: number }) {
  return (
    <Pressable
      style={({ pressed }) => [
        { height: cardHeight, aspectRatio: 1 },
        styles.newRecipeCard,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      accessibilityLabel={recipe.title}
    >
      <View style={styles.newRecipeImageContainer}>
        {recipe.photoUri ? (
          <Image
            source={{ uri: recipe.photoUri }}
            style={styles.newRecipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.newRecipeImage, styles.newRecipePlaceholder]}>
            <Icon name="camera" size="lg" color={colors.textLight} />
          </View>
        )}
        <View style={styles.newRecipeOverlay}>
          <Text style={styles.newRecipeTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: recipes, isLoading, error } = useRecipes();

  const storeCollections = useCollectionStore((s) => s.collections);
  const addCollection = useCollectionStore((s) => s.addCollection);

  const latestRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];
    return recipes.slice(0, 2);
  }, [recipes]);

  const collections = useMemo(() => {
    if (!recipes || recipes.length === 0) return { recipeBooks: [], menus: [] };

    const recipeImages = recipes.filter((r) => r.photoUri).map((r) => r.photoUri as string);

    const recipeBooks = [
      {
        id: 'all',
        name: 'Toutes les recettes',
        images: recipeImages.slice(0, 4),
      },
    ];

    const menus = [
      {
        id: 'menu-1',
        name: 'Menu semaine',
        images: recipeImages.slice(0, 4),
      },
    ];

    const customBooks = storeCollections
      .filter((c) => c.type === 'recipeBook')
      .map((c) => ({ id: c.id, name: c.name, images: [] as string[] }));
    const customMenuItems = storeCollections
      .filter((c) => c.type === 'menu')
      .map((c) => ({ id: c.id, name: c.name, images: [] as string[] }));

    return { recipeBooks: [...recipeBooks, ...customBooks], menus: [...menus, ...customMenuItems] };
  }, [recipes, storeCollections]);

  const handleCollectionPress = (id: string) => {
    if (id === 'all') {
      router.push({ pathname: '/(tabs)/search', params: { bookId: '' } });
    } else {
      router.push({ pathname: '/(tabs)/search', params: { bookId: id } });
    }
  };

  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [modalTarget, setModalTarget] = useState<'recipeBooks' | 'menus'>('recipeBooks');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showNewCollectionModal) {
      slideAnim.setValue(300);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    }
  }, [showNewCollectionModal, slideAnim, backdropAnim]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNewCollectionModal(false);
      setNewCollectionName('');
    });
  };

  const handleNewRecipeBook = () => {
    setModalTarget('recipeBooks');
    setNewCollectionName('');
    setShowNewCollectionModal(true);
  };

  const handleNewMenu = () => {
    setModalTarget('menus');
    setNewCollectionName('');
    setShowNewCollectionModal(true);
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim(), modalTarget === 'recipeBooks' ? 'recipeBook' : 'menu');
    closeModal();
  };

  // Compute card heights based on available screen space
  const availableHeight = SCREEN_HEIGHT - FIXED_OVERHEAD - insets.top - insets.bottom;
  const recipeCardHeight = availableHeight * 0.45;
  const collectionCardHeight = availableHeight * 0.33;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.logoContainer}>
          <MmmhLogo width={140} />
        </View>
        <RecipeGridSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="calories" size="lg" color={colors.error} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.logoContainer}>
        <MmmhLogo width={140} />
      </View>

      <View style={styles.sectionsContainer}>
        {/* Nouvelle recette section */}
        {latestRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouvelle recette</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newRecipeRow}
            >
              {latestRecipes.map((recipe) => (
                <NewRecipeCard key={recipe.id} recipe={recipe} cardHeight={recipeCardHeight} />
              ))}
            </ScrollView>
          </View>
        )}

        <CollectionSection
          title="Livre de recette"
          collections={collections.recipeBooks}
          onCollectionPress={handleCollectionPress}
          onNewPress={handleNewRecipeBook}
          showNewButton
          cardHeight={collectionCardHeight}
        />

        <CollectionSection
          title="Regime & Menu"
          collections={collections.menus}
          onCollectionPress={handleCollectionPress}
          onNewPress={handleNewMenu}
          showNewButton
          cardHeight={collectionCardHeight}
        />
      </View>

      <Modal
        visible={showNewCollectionModal}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Animated.View
            style={[styles.modalBackdrop, { opacity: backdropAnim }]}
            pointerEvents="none"
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <Animated.View
            style={[styles.modalSheetContainer, { transform: [{ translateY: slideAnim }] }]}
            pointerEvents="box-none"
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <Text style={styles.modalTitle}>
                {modalTarget === 'recipeBooks' ? 'Nouveau livre' : 'Nouveau menu'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nom du catalogue"
                placeholderTextColor={colors.textMuted}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
                onSubmitEditing={handleCreateCollection}
                returnKeyType="done"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  !newCollectionName.trim() && styles.modalButtonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                <Text style={styles.modalButtonText}>Créer</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Shanti',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  newRecipeRow: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  newRecipeCard: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  newRecipeImageContainer: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000',
  },
  newRecipeImage: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.surfaceAlt,
  },
  newRecipePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  newRecipeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  newRecipeTitle: {
    fontFamily: fonts.script,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalSheetContainer: {},
  modalSheet: {
    backgroundColor: colors.modalBackground,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.borderMedium,
    padding: spacing.lg,
    paddingBottom: spacing.md + SCREEN_HEIGHT,
    marginBottom: -SCREEN_HEIGHT,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.titleScript,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  modalButton: {
    width: '100%',
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.4,
  },
  modalButtonText: {
    fontFamily: fonts.script,
    fontSize: 16,
    color: colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.titleScript,
    color: colors.error,
    marginTop: spacing.md,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
