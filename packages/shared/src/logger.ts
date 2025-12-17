import type { Logger } from 'pino';

// Re-export Logger type
export type { Logger };

const isBrowser = typeof window !== 'undefined';

// Simple implementation of Pino interface using console
const createConsoleLogger = (context: Record<string, unknown> = {}): Logger => {
  const log = (level: string, objOrMsg: unknown, msg?: string) => {
    // In browser, we just log values. In Node, we might want one JSON line.
    // For simplicity and build safety, we'll just use console methods.
    
    let message = msg;
    let payload = {};

    if (typeof objOrMsg === 'string') {
      message = objOrMsg;
    } else {
      payload = objOrMsg || {};
      if (!message && (payload as any).msg) {
        message = (payload as any).msg;
      }
    }

    const merged = { ...context, ...payload };
    const timestamp = new Date().toISOString();

    if (isBrowser) {
      // Browser style
      // eslint-disable-next-line no-console
      const method = console[level as keyof Console] ? level : 'log';
      (console as any)[method](`[${level.toUpperCase()}]`, message, merged);
    } else {
      // Server style (JSON-like for structured logging tools to pick up)
      const output = {
        level,
        time: timestamp,
        msg: message,
        ...merged,
      };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(output));
    }
  };

  return {
    level: 'info',
    fatal: (obj: unknown, msg?: string) => log('error', obj, msg),
    error: (obj: unknown, msg?: string) => log('error', obj, msg),
    warn: (obj: unknown, msg?: string) => log('warn', obj, msg),
    info: (obj: unknown, msg?: string) => log('info', obj, msg),
    debug: (obj: unknown, msg?: string) => log('debug', obj, msg),
    trace: (obj: unknown, msg?: string) => log('debug', obj, msg),
    silent: () => {},
    child: (bindings: Record<string, unknown>) => createConsoleLogger({ ...context, ...bindings }),
  } as unknown as Logger;
};

export const logger = createConsoleLogger();

/**
 * Creates a child logger with bound context
 * @param context - Object to bind to the logger (e.g. { module: 'auth' })
 */
export const createLogger = (context: Record<string, unknown>): Logger => {
  return logger.child(context);
};
