import { trackEvent } from '../../src/utils/analytics';

describe('trackEvent', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('logs trial_started event in dev mode', () => {
    trackEvent('trial_started', { date: '2026-02-17T00:00:00Z' });

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] trial_started', {
      date: '2026-02-17T00:00:00Z',
    });
  });

  it('logs trial_import_used event with params', () => {
    trackEvent('trial_import_used', { dayNumber: 3, importType: 'video' });

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] trial_import_used', {
      dayNumber: 3,
      importType: 'video',
    });
  });

  it('logs trial_expired event with params', () => {
    trackEvent('trial_expired', { date: '2026-02-24T00:00:00Z', totalImportsUsed: 5 });

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] trial_expired', {
      date: '2026-02-24T00:00:00Z',
      totalImportsUsed: 5,
    });
  });

  it('logs trial_converted event with params', () => {
    trackEvent('trial_converted', { dayNumber: 4, totalImportsUsed: 3 });

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] trial_converted', {
      dayNumber: 4,
      totalImportsUsed: 3,
    });
  });

  it('logs quota_exhausted_vps event', () => {
    trackEvent('quota_exhausted_vps', { deviceId: 'dev-1', tier: 'free' });

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] quota_exhausted_vps', {
      deviceId: 'dev-1',
      tier: 'free',
    });
  });

  it('logs quota_exhausted_gemini event', () => {
    trackEvent('quota_exhausted_gemini', { deviceId: 'dev-1', dayOfTrial: 3 });

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] quota_exhausted_gemini', {
      deviceId: 'dev-1',
      dayOfTrial: 3,
    });
  });

  it('logs fallback_accepted event', () => {
    trackEvent('fallback_accepted', {});

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] fallback_accepted', {});
  });

  it('logs fallback_declined event', () => {
    trackEvent('fallback_declined', {});

    expect(consoleSpy).toHaveBeenCalledWith('[analytics] fallback_declined', {});
  });
});
