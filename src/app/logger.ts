import pino from 'pino';
import env from './env';

/**
 * Application-wide structured logger built on pino.
 *
 * - Development: pretty-printed, colorized output via pino-pretty
 * - Production:  JSON lines (ingestion-ready for Datadog / Loki / CloudWatch)
 *
 * Sensitive fields (password, token, authorization) are redacted before
 * the log line is serialised to prevent accidental credential leakage.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',

  // Redact sensitive fields at every log level
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },

  // Structured metadata serialized with every log entry
  formatters: {
    level(label) {
      return { level: label };
    },
  },

  // ISO 8601 timestamp on every line
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty-print only in development
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
