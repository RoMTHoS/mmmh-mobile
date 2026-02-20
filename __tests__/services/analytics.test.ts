/**
 * Tests for the Mixpanel HTTP analytics service.
 *
 * @see Story 6.1 Task 8
 */

const mockFetch = jest.fn().mockResolvedValue({ text: () => Promise.resolve('1') });

function setupMocks(opts: { token?: string; enabled?: boolean | string } = {}) {
  const token = opts.token ?? 'test-token-123';
  const enabled = opts.enabled ?? true;

  mockFetch.mockClear();

  jest.resetModules();

  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      expoConfig: {
        version: '1.0.0',
        extra: {
          mixpanelToken: token,
          analyticsEnabled: enabled,
        },
      },
    },
  }));

  // Mock global fetch
  global.fetch = mockFetch as unknown as typeof fetch;
  // Mock global btoa
  global.btoa = (str: string) => Buffer.from(str).toString('base64');
}

function loadAnalytics() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../src/services/analytics')
    .analytics as (typeof import('../../src/services/analytics'))['analytics'];
}

function parseFetchPayload(callIndex = 0): Record<string, unknown> {
  const url = mockFetch.mock.calls[callIndex][0] as string;
  const dataParam = new URL(url).searchParams.get('data')!;
  return JSON.parse(Buffer.from(dataParam, 'base64').toString());
}

describe('analytics service', () => {
  describe('initialize()', () => {
    it('enables analytics when token and flag are set', async () => {
      setupMocks();
      const analytics = loadAnalytics();

      await analytics.initialize();

      expect(analytics.getIsEnabled()).toBe(true);
    });

    it('is a no-op when ANALYTICS_ENABLED is false', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();

      await analytics.initialize();

      expect(analytics.getIsEnabled()).toBe(false);
    });

    it('is a no-op when token is empty', async () => {
      setupMocks({ token: '' });
      const analytics = loadAnalytics();

      await analytics.initialize();

      expect(analytics.getIsEnabled()).toBe(false);
    });
  });

  describe('track()', () => {
    it('sends event to Mixpanel track API with correct payload', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('Import Started', { import_type: 'video', platform: 'instagram' });

      // Wait for async fetch
      await new Promise((r) => setTimeout(r, 0));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const payload = parseFetchPayload(0);
      expect(payload).toMatchObject({
        event: 'Import Started',
        properties: expect.objectContaining({
          token: 'test-token-123',
          import_type: 'video',
          platform: 'instagram',
        }),
      });
    });

    it('is a no-op when analytics is disabled', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('Import Started', { import_type: 'video' });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('works without properties', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('App Opened');

      await new Promise((r) => setTimeout(r, 0));
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const payload = parseFetchPayload(0);
      expect(payload.event).toBe('App Opened');
    });
  });

  describe('identify()', () => {
    it('sets device UUID as distinct ID for subsequent events', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.identify('device-uuid-123');
      analytics.track('App Opened');

      await new Promise((r) => setTimeout(r, 0));
      const payload = parseFetchPayload(0);
      expect((payload.properties as Record<string, unknown>).distinct_id).toBe('device-uuid-123');
    });

    it('uses anonymous when not identified', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('App Opened');

      await new Promise((r) => setTimeout(r, 0));
      const payload = parseFetchPayload(0);
      expect((payload.properties as Record<string, unknown>).distinct_id).toBe('anonymous');
    });
  });

  describe('setUserProperties()', () => {
    it('sends profile update to Mixpanel engage API', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();
      analytics.identify('device-uuid-123');

      analytics.setUserProperties({ recipes_count: 5, plan_tier: 'trial' });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/engage');
      const payload = parseFetchPayload(0);
      expect(payload).toMatchObject({
        $token: 'test-token-123',
        $distinct_id: 'device-uuid-123',
        $set: { recipes_count: 5, plan_tier: 'trial' },
      });
    });

    it('is a no-op when analytics is disabled', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.setUserProperties({ recipes_count: 5 });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('clears distinct ID so subsequent events use anonymous', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();
      analytics.identify('device-uuid-123');

      analytics.reset();
      analytics.track('App Opened');

      await new Promise((r) => setTimeout(r, 0));
      const payload = parseFetchPayload(0);
      expect((payload.properties as Record<string, unknown>).distinct_id).toBe('anonymous');
    });
  });

  describe('no PII policy', () => {
    it('never includes email, name, or phone in tracked events', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('App Opened');
      analytics.track('Recipe Created', { recipe_id: 'abc-123', source: 'instagram' });
      analytics.track('Import Started', { import_type: 'photo' });
      analytics.setUserProperties({
        device_type: 'ios',
        os_version: '17.0',
        app_version: '1.0.0',
        recipes_count: 3,
        plan_tier: 'free',
      });

      await new Promise((r) => setTimeout(r, 0));

      const piiFields = ['email', 'name', 'phone', 'address', 'firstName', 'lastName'];

      for (const call of mockFetch.mock.calls) {
        const url = call[0] as string;
        const dataParam = new URL(url).searchParams.get('data')!;
        const payload = JSON.parse(Buffer.from(dataParam, 'base64').toString());
        const propsToCheck = payload.properties || payload.$set || {};
        for (const field of piiFields) {
          expect(propsToCheck).not.toHaveProperty(field);
        }
      }
    });
  });
});
