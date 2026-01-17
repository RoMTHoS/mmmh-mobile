import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function SettingsItem({ icon, title, subtitle, onPress }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={22} color="#D97706" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsSection title="General">
        <SettingsItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage notification preferences"
          onPress={() => {
            // TODO: Story 4.7 - Implement notifications settings
          }}
        />
        <SettingsItem
          icon="color-palette-outline"
          title="Appearance"
          subtitle="Light mode"
          onPress={() => {
            // TODO: Story 4.7 - Implement appearance settings
          }}
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsItem
          icon="cloud-upload-outline"
          title="Backup & Sync"
          subtitle="Backup your recipes"
          onPress={() => {
            // TODO: V1.0+ - Implement backup
          }}
        />
        <SettingsItem
          icon="trash-outline"
          title="Clear Cache"
          onPress={() => {
            // TODO: Story 4.7 - Implement cache clearing
          }}
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsItem icon="information-circle-outline" title="Version" subtitle="1.0.0" />
        <SettingsItem
          icon="document-text-outline"
          title="Privacy Policy"
          onPress={() => {
            // TODO: Open privacy policy
          }}
        />
        <SettingsItem
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => {
            // TODO: Open help
          }}
        />
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  itemPressed: {
    backgroundColor: '#F3F4F6',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
