import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PhotoPreview } from '../../../src/components/import/PhotoPreview';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('PhotoPreview', () => {
  const mockUri = 'file:///test/photo.jpg';
  const mockOnRetake = jest.fn();
  const mockOnUsePhoto = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component without crashing', () => {
    const { toJSON } = render(
      <PhotoPreview uri={mockUri} onRetake={mockOnRetake} onUsePhoto={mockOnUsePhoto} />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('renders retake button with French label', () => {
    render(<PhotoPreview uri={mockUri} onRetake={mockOnRetake} onUsePhoto={mockOnUsePhoto} />);

    expect(screen.getByText('Reprendre')).toBeTruthy();
  });

  it('renders use photo button with French label', () => {
    render(<PhotoPreview uri={mockUri} onRetake={mockOnRetake} onUsePhoto={mockOnUsePhoto} />);

    expect(screen.getByText('Utiliser cette photo')).toBeTruthy();
  });

  it('calls onRetake when retake button is pressed', () => {
    render(<PhotoPreview uri={mockUri} onRetake={mockOnRetake} onUsePhoto={mockOnUsePhoto} />);

    fireEvent.press(screen.getByText('Reprendre'));
    expect(mockOnRetake).toHaveBeenCalled();
  });

  it('calls onUsePhoto when use photo button is pressed', () => {
    render(<PhotoPreview uri={mockUri} onRetake={mockOnRetake} onUsePhoto={mockOnUsePhoto} />);

    fireEvent.press(screen.getByText('Utiliser cette photo'));
    expect(mockOnUsePhoto).toHaveBeenCalled();
  });
});
