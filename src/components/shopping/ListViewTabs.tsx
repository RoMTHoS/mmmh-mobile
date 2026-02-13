import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export type ListViewTab = 'categories' | 'recipe' | 'unsorted';

interface ListViewTabsProps {
  activeTab: ListViewTab;
  onTabChange: (tab: ListViewTab) => void;
}

const TABS: { key: ListViewTab; label: string }[] = [
  { key: 'categories', label: 'Catégories' },
  { key: 'recipe', label: 'Recette' },
  { key: 'unsorted', label: 'Non trié' },
];

export function ListViewTabs({ activeTab, onTabChange }: ListViewTabsProps) {
  return (
    <View style={styles.container} testID="list-view-tabs">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
            {isActive && <View style={styles.underline} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  tab: {
    marginRight: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent,
  },
});
