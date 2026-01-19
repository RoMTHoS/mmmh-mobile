import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function MenuItem({ icon, title, subtitle, onPress }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function MenuScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MenuSection title="Général">
        <MenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Gérer les préférences"
          onPress={() => {
            // TODO: Implement notifications settings
          }}
        />
        <MenuItem
          icon="color-palette-outline"
          title="Apparence"
          subtitle="Mode clair"
          onPress={() => {
            // TODO: Implement appearance settings
          }}
        />
      </MenuSection>

      <MenuSection title="Données">
        <MenuItem
          icon="cloud-upload-outline"
          title="Sauvegarde & Sync"
          subtitle="Sauvegarder vos recettes"
          onPress={() => {
            // TODO: V1.0+ - Implement backup
          }}
        />
        <MenuItem
          icon="trash-outline"
          title="Vider le cache"
          onPress={() => {
            // TODO: Implement cache clearing
          }}
        />
      </MenuSection>

      <MenuSection title="À propos">
        <MenuItem icon="information-circle-outline" title="Version" subtitle="1.0.0" />
        <MenuItem
          icon="document-text-outline"
          title="Politique de confidentialité"
          onPress={() => {
            // TODO: Open privacy policy
          }}
        />
        <MenuItem
          icon="help-circle-outline"
          title="Aide & Support"
          onPress={() => {
            // TODO: Open help
          }}
        />
      </MenuSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.base,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemPressed: {
    backgroundColor: colors.background,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
