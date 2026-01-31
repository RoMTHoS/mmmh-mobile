import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../theme';

export function AIBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>IA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1976D2',
  },
});
