import { useState } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { ImportModal } from '../../src/components/import/ImportModal';
import { Icon } from '../../src/components/ui';
import { useActiveShoppingList, useShoppingListRecipes } from '../../src/hooks/useShoppingList';
import { useShoppingStore } from '../../src/stores/shoppingStore';

function CartTabIcon({ color }: { color: string }) {
  const activeListId = useShoppingStore((s) => s.activeListId);
  const listQuery = useActiveShoppingList();
  const defaultListId = listQuery.data?.id ?? '';
  const effectiveListId = activeListId ?? defaultListId;
  const recipesQuery = useShoppingListRecipes(effectiveListId);
  const count = recipesQuery.data?.length ?? 0;

  return (
    <View>
      <Icon name="cart-outline" size={32} color={color} />
      {count > 0 && (
        <View style={styles.badge} testID="cart-badge">
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const [importModalVisible, setImportModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            paddingTop: spacing.sm,
            paddingHorizontal: spacing.md,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <Icon name="home" size={32} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Rechercher',
            tabBarIcon: ({ color }) => <Icon name="search" size={32} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add-placeholder"
          options={{
            title: '',
            tabBarButton: () => (
              <Pressable
                onPress={() => setImportModalVisible(true)}
                style={styles.addButton}
                accessibilityLabel="Ajouter une recette"
                accessibilityRole="button"
              >
                <Icon name="plus-circle" size={36} color={colors.tabBarActive} />
              </Pressable>
            ),
          }}
          listeners={{ tabPress: (e) => e.preventDefault() }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <CartTabIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color }) => <Icon name="menu" size={32} color={color} />,
          }}
        />
      </Tabs>
      <ImportModal visible={importModalVisible} onClose={() => setImportModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: -4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 9999,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
