import { useState } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
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
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingBottom: spacing.sm,
          },
          tabBarLabelStyle: {
            fontSize: 11,
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
            tabBarIcon: ({ color }) => <Icon name="home" size="lg" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Rechercher',
            tabBarIcon: ({ color }) => <Icon name="search" size="lg" color={color} />,
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
                <View style={styles.addButtonInner}>
                  <Icon name="plus" size="lg" color={colors.surface} />
                </View>
              </Pressable>
            ),
          }}
          listeners={{ tabPress: (e) => e.preventDefault() }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <Icon name="cart" size="lg" color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color }) => <Icon name="menu" size="lg" color={color} />,
          }}
        />
      </Tabs>
      <ImportModal visible={importModalVisible} onClose={() => setImportModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  addButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
