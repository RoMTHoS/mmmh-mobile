type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only log errors; in dev, log everything
const currentLevel: LogLevel = __DEV__ ? 'debug' : 'error';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }
  return ` ${JSON.stringify(context)}`;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = formatTimestamp();
  const contextStr = formatContext(context);
  const levelUpper = level.toUpperCase().padEnd(5);

  if (__DEV__) {
    return `${LOG_COLORS[level]}[${timestamp}] [${levelUpper}] ${message}${contextStr}${LOG_COLORS.reset}`;
  }
  return `[${timestamp}] [${levelUpper}] ${message}${contextStr}`;
}

function formatError(error: Error | undefined): LogContext | undefined {
  if (!error) {
    return undefined;
  }
  return {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
  };
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  error(message: string, error?: Error, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext = formatError(error);
      const mergedContext = errorContext ? { ...context, ...errorContext } : context;

      console.error(formatMessage('error', message, mergedContext));

      // TODO: Story 0.1 - Uncomment when Sentry is configured
      // if (error) {
      //   Sentry.captureException(error, { extra: context });
      // }
    }
  },
};

export type { LogLevel, LogContext };
