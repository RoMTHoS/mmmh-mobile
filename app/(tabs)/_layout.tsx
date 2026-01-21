import { useState } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { ImportModal } from '../../src/components/import/ImportModal';
import { Icon } from '../../src/components/ui';

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
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.text,
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
            tabBarIcon: ({ color }) => <Icon name="cart" size={32} color={color} />,
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
});
