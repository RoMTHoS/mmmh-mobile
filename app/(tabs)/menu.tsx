import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { initDeviceId, getDeviceId } from '../../src/services/planSync';
import { getDatabase } from '../../src/services/database';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, isLast }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        isLast && styles.itemLast,
        pressed && styles.itemPressed,
      ]}
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
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const handleResetTrial = async () => {
    Alert.alert(
      'Reset trial & device ID',
      'Ceci va supprimer le device ID, remettre le plan à free, et en générer un nouveau. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear device ID from AsyncStorage
              await AsyncStorage.removeItem('MMMH_DEVICE_ID');

              // Reset plan to free in SQLite
              const db = getDatabase();
              db.runSync(
                `UPDATE user_plan SET tier = 'free', trial_start_date = NULL, trial_ends_date = NULL, premium_activated_date = NULL, promo_code = NULL, updated_at = ?`,
                [new Date().toISOString()]
              );

              // Reset usage counters
              db.runSync(`DELETE FROM import_usage`);

              // Generate new device ID
              const newId = await initDeviceId();

              // Invalidate all queries so UI refreshes
              queryClient.invalidateQueries();

              Toast.show({
                type: 'success',
                text1: 'Reset complete',
                text2: `New device ID: ${newId.slice(0, 8)}...`,
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Reset failed',
                text2: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
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
          isLast
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
          isLast
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
          isLast
        />
      </MenuSection>

      {__DEV__ && (
        <MenuSection title="Développeur">
          <MenuItem
            icon="id-card-outline"
            title="Device ID"
            subtitle={getDeviceId()?.slice(0, 8) ?? 'non initialisé'}
          />
          <MenuItem
            icon="refresh-outline"
            title="Reset trial & device ID"
            subtitle="Remet le plan à free avec un nouveau device"
            onPress={handleResetTrial}
            isLast
          />
        </MenuSection>
      )}
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
  itemLast: {
    borderBottomWidth: 0,
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
