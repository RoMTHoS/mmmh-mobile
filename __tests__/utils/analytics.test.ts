/**
 * Tests for the typed trackEvent wrapper (src/utils/analytics.ts).
 *
 * Verifies that trackEvent delegates to the Mixpanel analytics service.
 */

const mockTrack = jest.fn();
jest.mock('../../src/services/analytics', () => ({
  analytics: { track: mockTrack },
}));

import { trackEvent } from '../../src/utils/analytics';

describe('trackEvent', () => {
  beforeEach(() => {
    mockTrack.mockClear();
  });

  it('delegates trial_started event to analytics service', () => {
    trackEvent('trial_started', { date: '2026-02-17T00:00:00Z' });

    expect(mockTrack).toHaveBeenCalledWith('trial_started', {
      date: '2026-02-17T00:00:00Z',
    });
  });

  it('delegates trial_import_used event with params', () => {
    trackEvent('trial_import_used', { dayNumber: 3, importType: 'video' });

    expect(mockTrack).toHaveBeenCalledWith('trial_import_used', {
      dayNumber: 3,
      importType: 'video',
    });
  });

  it('delegates trial_expired event with params', () => {
    trackEvent('trial_expired', { date: '2026-02-24T00:00:00Z', totalImportsUsed: 5 });

    expect(mockTrack).toHaveBeenCalledWith('trial_expired', {
      date: '2026-02-24T00:00:00Z',
      totalImportsUsed: 5,
    });
  });

  it('delegates trial_converted event with params', () => {
    trackEvent('trial_converted', { dayNumber: 4, totalImportsUsed: 3 });

    expect(mockTrack).toHaveBeenCalledWith('trial_converted', {
      dayNumber: 4,
      totalImportsUsed: 3,
    });
  });

  it('delegates quota_exhausted_vps event', () => {
    trackEvent('quota_exhausted_vps', { deviceId: 'dev-1', tier: 'free' });

    expect(mockTrack).toHaveBeenCalledWith('quota_exhausted_vps', {
      deviceId: 'dev-1',
      tier: 'free',
    });
  });

  it('delegates quota_exhausted_gemini event', () => {
    trackEvent('quota_exhausted_gemini', { deviceId: 'dev-1', dayOfTrial: 3 });

    expect(mockTrack).toHaveBeenCalledWith('quota_exhausted_gemini', {
      deviceId: 'dev-1',
      dayOfTrial: 3,
    });
  });

  it('delegates fallback_accepted event', () => {
    trackEvent('fallback_accepted', {});

    expect(mockTrack).toHaveBeenCalledWith('fallback_accepted', {});
  });

  it('delegates fallback_declined event', () => {
    trackEvent('fallback_declined', {});

    expect(mockTrack).toHaveBeenCalledWith('fallback_declined', {});
  });
});
