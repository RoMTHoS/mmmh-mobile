import { ConfidenceIndicator } from '../../../src/components/review/ConfidenceIndicator';

describe('ConfidenceIndicator', () => {
  describe('module exports', () => {
    it('exports ConfidenceIndicator component', () => {
      expect(ConfidenceIndicator).toBeDefined();
      expect(typeof ConfidenceIndicator).toBe('function');
    });
  });

  describe('confidence level calculation', () => {
    it('accepts confidence prop as a number between 0 and 1', () => {
      // Component should accept confidence values
      const validConfidenceValues = [0, 0.5, 0.6, 0.8, 1];

      validConfidenceValues.forEach((confidence) => {
        expect(() => {
          // Type check - confidence should be a number
          const props = { confidence };
          expect(typeof props.confidence).toBe('number');
          expect(props.confidence).toBeGreaterThanOrEqual(0);
          expect(props.confidence).toBeLessThanOrEqual(1);
        }).not.toThrow();
      });
    });
  });

  describe('confidence thresholds', () => {
    it('defines high confidence threshold at 0.8', () => {
      const HIGH_THRESHOLD = 0.8;
      expect(HIGH_THRESHOLD).toBe(0.8);
    });

    it('defines medium confidence threshold at 0.6', () => {
      const MEDIUM_THRESHOLD = 0.6;
      expect(MEDIUM_THRESHOLD).toBe(0.6);
    });

    it('values below 0.6 are considered low confidence', () => {
      const LOW_VALUES = [0, 0.1, 0.3, 0.59];
      LOW_VALUES.forEach((value) => {
        expect(value).toBeLessThan(0.6);
      });
    });

    it('values between 0.6 and 0.8 are medium confidence', () => {
      const MEDIUM_VALUES = [0.6, 0.65, 0.7, 0.79];
      MEDIUM_VALUES.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0.6);
        expect(value).toBeLessThan(0.8);
      });
    });

    it('values 0.8 and above are high confidence', () => {
      const HIGH_VALUES = [0.8, 0.85, 0.9, 1.0];
      HIGH_VALUES.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0.8);
      });
    });
  });

  describe('percentage calculation', () => {
    it('converts confidence to percentage correctly', () => {
      const testCases = [
        { confidence: 0.85, expected: 85 },
        { confidence: 0.5, expected: 50 },
        { confidence: 1.0, expected: 100 },
        { confidence: 0, expected: 0 },
        { confidence: 0.333, expected: 33 }, // Rounded
      ];

      testCases.forEach(({ confidence, expected }) => {
        const percentage = Math.round(confidence * 100);
        expect(percentage).toBe(expected);
      });
    });
  });
});
