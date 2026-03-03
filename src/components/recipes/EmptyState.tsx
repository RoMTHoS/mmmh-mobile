import { router } from 'expo-router';
import { EmptyState as BaseEmptyState } from '../ui/EmptyState';

export function EmptyState() {
  return (
    <BaseEmptyState
      icon="bookmark"
      title="Aucune recette"
      description="Appuyez sur + pour créer votre première recette"
      actionLabel="Créer une recette"
      onAction={() => router.push('/recipe/create')}
    />
  );
}
