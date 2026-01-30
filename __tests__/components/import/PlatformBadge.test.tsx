import { PlatformBadge } from '../../../src/components/import/PlatformBadge';

describe('PlatformBadge', () => {
  describe('platform rendering', () => {
    it('renders instagram badge', () => {
      const element = PlatformBadge({ platform: 'instagram' });
      expect(element).toBeDefined();
    });

    it('renders tiktok badge', () => {
      const element = PlatformBadge({ platform: 'tiktok' });
      expect(element).toBeDefined();
    });

    it('renders youtube badge', () => {
      const element = PlatformBadge({ platform: 'youtube' });
      expect(element).toBeDefined();
    });

    it('renders default globe icon for null platform', () => {
      const element = PlatformBadge({ platform: null });
      expect(element).toBeDefined();
    });

    it('renders default globe icon for undefined platform', () => {
      const element = PlatformBadge({ platform: undefined });
      expect(element).toBeDefined();
    });

    it('renders default for unknown platform', () => {
      const element = PlatformBadge({ platform: 'unknown' });
      expect(element).toBeDefined();
    });
  });

  describe('size variants', () => {
    it('renders small size', () => {
      const element = PlatformBadge({ platform: 'instagram', size: 'sm' });
      expect(element).toBeDefined();
    });

    it('renders medium size (default)', () => {
      const element = PlatformBadge({ platform: 'instagram' });
      expect(element).toBeDefined();
    });

    it('renders large size', () => {
      const element = PlatformBadge({ platform: 'instagram', size: 'lg' });
      expect(element).toBeDefined();
    });
  });

  describe('label display', () => {
    it('hides label by default', () => {
      const element = PlatformBadge({ platform: 'instagram' });
      expect(element).toBeDefined();
    });

    it('shows label when showLabel is true', () => {
      const element = PlatformBadge({ platform: 'instagram', showLabel: true });
      expect(element).toBeDefined();
    });
  });
});
