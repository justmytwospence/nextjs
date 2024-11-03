'use server-only';

import winston from 'winston';
import 'winston-daily-rotate-file';

export const baseLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      const metaString = Object.keys(metadata).length
        ? '\n' + JSON.stringify(metadata, null, 2)
        : '';
      return `${timestamp} ${level}: ${message}${metaString}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ]
});

export function createSessionLogger(session: Session | null) {
  const logger = baseLogger.child({});

  logger.add(
    new winston.transports.DailyRotateFile({
      filename: 'logs/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );

  if (!session) {
    return logger;
  }

  return logger.child({
    userId: session?.user?.id || 'unknown',
    sessionId: session?.sessionToken || 'unknown'
  });
}
