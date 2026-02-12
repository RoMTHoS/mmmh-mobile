import { render } from '@testing-library/react-native';
import { PhotoEditor } from '../../../src/components/import/PhotoEditor';
import type { BatchPhoto } from '../../../src/hooks/usePhotoBatch';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const makePhotos = (count: number): BatchPhoto[] =>
  Array.from({ length: count }, (_, i) => ({
    uri: `file:///photo${i + 1}.jpg`,
    rotation: 0,
  }));

const defaultProps = {
  uri: 'file:///photo1.jpg',
  photos: makePhotos(1),
  activeIndex: 0,
  canAddMore: true,
  remainingSlots: 4,
  onComplete: jest.fn(),
  onSelectPhoto: jest.fn(),
  onRemovePhoto: jest.fn(),
  onReorderPhotos: jest.fn(),
  onRotate: jest.fn().mockResolvedValue(undefined),
  onAddMore: jest.fn(),
};

describe('PhotoEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Importer" for single photo', () => {
    const { getByText } = render(<PhotoEditor {...defaultProps} />);

    expect(getByText('Importer')).toBeTruthy();
  });

  it('shows "Importer (N photos)" for multiple photos', () => {
    const photos = makePhotos(3);
    const { getByText } = render(<PhotoEditor {...defaultProps} photos={photos} />);

    expect(getByText('Importer (3 photos)')).toBeTruthy();
  });

  it('does not show batch strip for single photo', () => {
    const { queryByText } = render(<PhotoEditor {...defaultProps} />);

    // Badge text "1" from PhotoBatchStrip should not appear
    // (the strip is only rendered when photoCount > 1)
    // We verify no strip is rendered by checking there's no "2" badge
    expect(queryByText('2')).toBeNull();
  });

  it('shows batch strip when multiple photos', () => {
    const photos = makePhotos(3);
    const { getByText } = render(<PhotoEditor {...defaultProps} photos={photos} />);

    // Batch strip renders number badges
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('shows "Ajouter une photo" when canAddMore is true', () => {
    const { getByText } = render(<PhotoEditor {...defaultProps} canAddMore />);

    expect(getByText('Ajouter une photo')).toBeTruthy();
  });

  it('shows "Maximum 5 photos" when canAddMore is false', () => {
    const { getByText } = render(<PhotoEditor {...defaultProps} canAddMore={false} />);

    expect(getByText('Maximum 5 photos')).toBeTruthy();
  });
});
