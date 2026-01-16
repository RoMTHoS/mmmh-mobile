import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { logger } from '../../src/utils/logger';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedLogger = jest.mocked(logger);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be a valid React component class', () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
  });

  it('should have getDerivedStateFromError static method', () => {
    expect(ErrorBoundary.getDerivedStateFromError).toBeDefined();
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
  });

  it('getDerivedStateFromError should return error state', () => {
    const error = new Error('Test error');
    const state = ErrorBoundary.getDerivedStateFromError(error);

    expect(state).toEqual({
      hasError: true,
      error: error,
    });
  });

  it('should have componentDidCatch instance method', () => {
    expect(ErrorBoundary.prototype.componentDidCatch).toBeDefined();
  });

  it('componentDidCatch should call logger.error', () => {
    const instance = new ErrorBoundary({ children: null });

    const error = new Error('Test error');
    const errorInfo = { componentStack: 'at TestComponent' };

    instance.componentDidCatch(error, errorInfo);

    expect(mockedLogger.error).toHaveBeenCalledWith('React Error Boundary caught an error', error, {
      componentStack: 'at TestComponent',
    });
  });

  it('handleReset should reset error state', () => {
    const instance = new ErrorBoundary({ children: null });
    instance.state = { hasError: true, error: new Error('test') };

    // Mock setState
    const setStateMock = jest.fn();
    instance.setState = setStateMock;

    instance.handleReset();

    expect(setStateMock).toHaveBeenCalledWith({ hasError: false, error: null });
  });
});
