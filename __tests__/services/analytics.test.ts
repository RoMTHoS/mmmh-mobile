/**
 * Tests for the Mixpanel analytics service.
 *
 * @see Story 6.1 Task 8
 */

let mockInit: jest.Mock;
let mockTrack: jest.Mock;
let mockIdentify: jest.Mock;
let mockReset: jest.Mock;
let mockPeopleSet: jest.Mock;

function setupMocks(opts: { token?: string; enabled?: boolean | string } = {}) {
  const token = opts.token ?? 'test-token-123';
  const enabled = opts.enabled ?? true;

  mockInit = jest.fn().mockResolvedValue(undefined);
  mockTrack = jest.fn();
  mockIdentify = jest.fn();
  mockReset = jest.fn();
  mockPeopleSet = jest.fn();

  jest.resetModules();

  jest.doMock('mixpanel-react-native', () => ({
    Mixpanel: jest.fn().mockImplementation(() => ({
      init: mockInit,
      track: mockTrack,
      identify: mockIdentify,
      reset: mockReset,
      getPeople: jest.fn().mockReturnValue({ set: mockPeopleSet }),
    })),
  }));

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
}

function loadAnalytics() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../src/services/analytics')
    .analytics as (typeof import('../../src/services/analytics'))['analytics'];
}

describe('analytics service', () => {
  describe('initialize()', () => {
    it('initializes Mixpanel with token when enabled', async () => {
      setupMocks();
      const analytics = loadAnalytics();

      await analytics.initialize();

      expect(mockInit).toHaveBeenCalled();
      expect(analytics.getIsEnabled()).toBe(true);
    });

    it('is a no-op when ANALYTICS_ENABLED is false', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();

      await analytics.initialize();

      expect(mockInit).not.toHaveBeenCalled();
      expect(analytics.getIsEnabled()).toBe(false);
    });

    it('is a no-op when token is empty', async () => {
      setupMocks({ token: '' });
      const analytics = loadAnalytics();

      await analytics.initialize();

      expect(mockInit).not.toHaveBeenCalled();
      expect(analytics.getIsEnabled()).toBe(false);
    });
  });

  describe('track()', () => {
    it('calls Mixpanel.track with correct event and properties', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('Import Started', { import_type: 'video', platform: 'instagram' });

      expect(mockTrack).toHaveBeenCalledWith('Import Started', {
        import_type: 'video',
        platform: 'instagram',
      });
    });

    it('is a no-op when analytics is disabled', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('Import Started', { import_type: 'video' });

      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('works without properties', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.track('App Opened');

      expect(mockTrack).toHaveBeenCalledWith('App Opened', undefined);
    });
  });

  describe('identify()', () => {
    it('sets device UUID as distinct ID', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.identify('device-uuid-123');

      expect(mockIdentify).toHaveBeenCalledWith('device-uuid-123');
    });

    it('is a no-op when analytics is disabled', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.identify('device-uuid-123');

      expect(mockIdentify).not.toHaveBeenCalled();
    });
  });

  describe('setUserProperties()', () => {
    it('calls Mixpanel people set', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.setUserProperties({ recipes_count: 5, plan_tier: 'trial' });

      expect(mockPeopleSet).toHaveBeenCalledWith({
        recipes_count: 5,
        plan_tier: 'trial',
      });
    });

    it('is a no-op when analytics is disabled', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.setUserProperties({ recipes_count: 5 });

      expect(mockPeopleSet).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('calls Mixpanel reset', async () => {
      setupMocks();
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.reset();

      expect(mockReset).toHaveBeenCalled();
    });

    it('is a no-op when analytics is disabled', async () => {
      setupMocks({ enabled: 'false' });
      const analytics = loadAnalytics();
      await analytics.initialize();

      analytics.reset();

      expect(mockReset).not.toHaveBeenCalled();
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

      const piiFields = ['email', 'name', 'phone', 'address', 'firstName', 'lastName'];

      for (const call of mockTrack.mock.calls) {
        const props = call[1];
        if (props) {
          for (const field of piiFields) {
            expect(props).not.toHaveProperty(field);
          }
        }
      }

      for (const call of mockPeopleSet.mock.calls) {
        const props = call[0];
        for (const field of piiFields) {
          expect(props).not.toHaveProperty(field);
        }
      }
    });
  });
});
