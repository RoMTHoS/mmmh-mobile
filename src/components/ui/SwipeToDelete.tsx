import { useRef } from 'react';
import { Alert, Animated, View, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors } from '../../theme';

interface SwipeToDeleteProps {
  onDelete: () => void;
  confirmTitle?: string;
  confirmMessage?: string;
  children: React.ReactNode;
}

function renderRightActions(
  _progress: Animated.AnimatedInterpolation<number>,
  dragX: Animated.AnimatedInterpolation<number>
) {
  const scale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.deleteAction}>
      <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>
        Supprimer
      </Animated.Text>
    </View>
  );
}

export function SwipeToDelete({
  onDelete,
  confirmTitle = 'Supprimer ?',
  confirmMessage = 'Voulez-vous vraiment supprimer cet élément ?',
  children,
}: SwipeToDeleteProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeOpen = () => {
    swipeableRef.current?.close();
    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      rightThreshold={80}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
