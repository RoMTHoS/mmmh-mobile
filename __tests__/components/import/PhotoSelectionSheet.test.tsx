import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PhotoSelectionSheet } from '../../../src/components/import/PhotoSelectionSheet';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('PhotoSelectionSheet', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both photo options', () => {
    render(<PhotoSelectionSheet visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('Prendre une photo')).toBeTruthy();
    expect(screen.getByText('Choisir depuis la galerie')).toBeTruthy();
  });

  it('renders the title', () => {
    render(<PhotoSelectionSheet visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('Importer une photo')).toBeTruthy();
  });

  it('renders cancel button', () => {
    render(<PhotoSelectionSheet visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

    expect(screen.getByText('Annuler')).toBeTruthy();
  });

  it('calls onSelect with "camera" when take photo is pressed', () => {
    render(<PhotoSelectionSheet visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

    fireEvent.press(screen.getByText('Prendre une photo'));
    expect(mockOnSelect).toHaveBeenCalledWith('camera');
  });

  it('calls onSelect with "gallery" when choose from gallery is pressed', () => {
    render(<PhotoSelectionSheet visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

    fireEvent.press(screen.getByText('Choisir depuis la galerie'));
    expect(mockOnSelect).toHaveBeenCalledWith('gallery');
  });

  it('calls onClose when cancel is pressed', () => {
    render(<PhotoSelectionSheet visible={true} onSelect={mockOnSelect} onClose={mockOnClose} />);

    fireEvent.press(screen.getByText('Annuler'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
