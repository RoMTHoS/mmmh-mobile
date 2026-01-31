import { AIBadge } from '../../../src/components/review/AIBadge';

describe('AIBadge', () => {
  describe('module exports', () => {
    it('exports AIBadge component', () => {
      expect(AIBadge).toBeDefined();
      expect(typeof AIBadge).toBe('function');
    });
  });

  describe('component structure', () => {
    it('is a valid React functional component', () => {
      expect(AIBadge.length).toBe(0); // No props required
    });
  });
});
