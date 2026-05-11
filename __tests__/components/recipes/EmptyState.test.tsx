import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../../../src/components/recipes/EmptyState';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('EmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state component', () => {
    const { getByTestId } = render(<EmptyState />);
    expect(getByTestId('empty-state')).toBeDefined();
  });

  it('displays correct title text', () => {
    const { getByText } = render(<EmptyState />);
    expect(getByText('Aucune recette')).toBeDefined();
  });

  it('renders a CTA button', () => {
    const { getByText } = render(<EmptyState />);
    expect(getByText('Créer une recette')).toBeDefined();
  });
});
