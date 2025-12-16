import pino, { type Logger, type LoggerOptions } from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isBrowser = typeof window !== 'undefined';

const config: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  // In the browser, pino uses console.log/error/etc by default which is what we want.
  // In Node, it logs JSON to stdout.
  browser: {
    asObject: true,
  },
};

// Create a base logger instance
export const logger: Logger = pino(config);

/**
 * Creates a child logger with bound context
 * @param context - Object to bind to the logger (e.g. { module: 'auth' })
 */
export const createLogger = (context: Record<string, unknown>): Logger => {
  return logger.child(context);
};
