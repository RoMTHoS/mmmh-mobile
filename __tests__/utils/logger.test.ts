import { logger } from '../../src/utils/logger';

describe('Logger', () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages in dev mode', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should include message in output', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Test debug message'));
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should include context in output', () => {
      logger.info('Test message', { key: 'value' });
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('value'));
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include error stack in output', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { userId: '123' });
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('stack'));
    });

    it('should include context in error output', () => {
      logger.error('Error occurred', undefined, { userId: '123' });
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('123'));
    });
  });

  describe('formatting', () => {
    it('should include timestamp in all logs', () => {
      logger.info('Test message');
      const call = consoleSpy.info.mock.calls[0][0] as string;
      // ISO timestamp format check (contains T and Z or timezone)
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include log level in output', () => {
      logger.warn('Test message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    });
  });
});
