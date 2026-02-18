import { PipelineBadge } from '../../../src/components/import/PipelineBadge';

describe('PipelineBadge', () => {
  describe('pipeline type rendering', () => {
    it('renders standard badge for VPS pipeline', () => {
      const element = PipelineBadge({ pipeline: 'vps' });
      expect(element).toBeDefined();
      expect(element.props.testID).toBe('pipeline-badge-standard');
    });

    it('renders premium badge for Gemini pipeline', () => {
      const element = PipelineBadge({ pipeline: 'gemini' });
      expect(element).toBeDefined();
      expect(element.props.testID).toBe('pipeline-badge-premium');
    });

    it('displays "Standard" text for VPS', () => {
      const element = PipelineBadge({ pipeline: 'vps' });
      const textChild = element.props.children;
      expect(textChild.props.children).toBe('Standard');
    });

    it('displays star + "Premium" text for Gemini', () => {
      const element = PipelineBadge({ pipeline: 'gemini' });
      const textChild = element.props.children;
      expect(textChild.props.children).toBe('\u2605 Premium');
    });
  });

  describe('size variants', () => {
    it('renders small size by default', () => {
      const element = PipelineBadge({ pipeline: 'vps' });
      expect(element).toBeDefined();
    });

    it('renders medium size', () => {
      const element = PipelineBadge({ pipeline: 'gemini', size: 'md' });
      expect(element).toBeDefined();
    });
  });
});
