/**
 * Tests for the feedback submission service.
 *
 * @see Story 6.2 Task 7
 */

import { Platform } from 'react-native';

// Mock dependencies before importing
jest.mock('../../src/services/planSync', () => ({
  getDeviceId: jest.fn(() => 'test-device-id-123'),
}));

jest.mock('../../src/services/database', () => ({
  getDatabase: jest.fn(() => ({
    getFirstSync: jest.fn((query: string) => {
      if (query.includes('recipes')) return { count: 42 };
      if (query.includes('import_usage')) return { total: 15 };
      return null;
    }),
  })),
}));

jest.mock('../../src/services/planDatabase', () => ({
  getUserPlan: jest.fn().mockResolvedValue({ tier: 'trial' }),
}));

const mockReadAsStringAsync = jest.fn().mockResolvedValue('base64-encoded-image-data');
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: mockReadAsStringAsync,
  EncodingType: { Base64: 'base64' },
}));

const mockFetch = jest.fn().mockResolvedValue({ ok: true });
global.fetch = mockFetch as unknown as typeof fetch;

import {
  gatherContext,
  submitFeedback,
  encodeScreenshot,
  type FeedbackPayload,
} from '../../src/services/feedback';

describe('feedback service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe('gatherContext()', () => {
    it('returns app version from expo constants', async () => {
      const ctx = await gatherContext();
      expect(ctx.appVersion).toBe('1.0.0');
    });

    it('includes device and OS info', async () => {
      const ctx = await gatherContext();
      expect(ctx.device).toContain(Platform.OS);
      expect(ctx.os).toBe(Platform.OS);
    });

    it('includes plan tier from planDatabase', async () => {
      const ctx = await gatherContext();
      expect(ctx.planTier).toBe('trial');
    });

    it('includes recipe count from database', async () => {
      const ctx = await gatherContext();
      expect(ctx.recipesCount).toBe(42);
    });

    it('includes imports count from database', async () => {
      const ctx = await gatherContext();
      expect(ctx.importsCount).toBe(15);
    });

    it('includes device ID', async () => {
      const ctx = await gatherContext();
      expect(ctx.deviceId).toBe('test-device-id-123');
    });
  });

  describe('encodeScreenshot()', () => {
    it('encodes image as base64', async () => {
      const result = await encodeScreenshot('file://test-image.jpg');
      expect(mockReadAsStringAsync).toHaveBeenCalledWith('file://test-image.jpg', {
        encoding: 'base64',
      });
      expect(result).toBe('base64-encoded-image-data');
    });
  });

  describe('submitFeedback()', () => {
    const basePayload: FeedbackPayload = {
      type: 'bug',
      message: 'Something is broken',
      context: {
        appVersion: '1.0.0',
        device: 'ios 17',
        os: 'ios',
        planTier: 'trial',
        recipesCount: 42,
        importsCount: 15,
        deviceId: 'test-device-id-123',
      },
    };

    it('sends correct payload to EmailJS API', async () => {
      await submitFeedback(basePayload);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.emailjs.com/api/v1.0/email/send');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.template_params).toMatchObject({
        feedback_type: 'Bug Report',
        message: 'Something is broken',
        app_version: '1.0.0',
        device: 'ios 17',
        os: 'ios',
        plan_tier: 'trial',
        recipes_count: 42,
        imports_count: 15,
        device_id: 'test-device-id-123',
      });
    });

    it('includes all auto-context fields in submission', async () => {
      await submitFeedback(basePayload);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const params = body.template_params;

      expect(params).toHaveProperty('app_version');
      expect(params).toHaveProperty('device');
      expect(params).toHaveProperty('os');
      expect(params).toHaveProperty('plan_tier');
      expect(params).toHaveProperty('recipes_count');
      expect(params).toHaveProperty('imports_count');
      expect(params).toHaveProperty('device_id');
    });

    it('includes screenshot as base64 data URI when provided', async () => {
      const payload: FeedbackPayload = {
        ...basePayload,
        screenshotBase64: 'abc123base64data',
      };

      await submitFeedback(payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.template_params.screenshot).toBe('data:image/jpeg;base64,abc123base64data');
    });

    it('omits screenshot field when not provided', async () => {
      await submitFeedback(basePayload);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.template_params).not.toHaveProperty('screenshot');
    });

    it('maps feedback types to human-readable labels', async () => {
      for (const [type, label] of [
        ['bug', 'Bug Report'],
        ['feature', 'Feature Request'],
        ['general', 'General Feedback'],
      ] as const) {
        mockFetch.mockClear();
        await submitFeedback({ ...basePayload, type });
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.template_params.feedback_type).toBe(label);
      }
    });

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(submitFeedback(basePayload)).rejects.toThrow('Feedback submission failed: 500');
    });
  });
});
