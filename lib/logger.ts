'use server-only';

import winston from 'winston';
import { Session } from 'next-auth';

const level = process.env.LOG_LEVEL || 'info';

export const baseLogger = winston.createLogger({
  level, // Add this line
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      const metaString = Object.keys(metadata).map(key => `${winston.format.colorize().colorize('info', key)}: ${metadata[key]}`).join(' ') + ' ';
      return `${timestamp} ${metaString}${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ]
});

export function createSessionLogger(session: Session | null) {
  const logger = baseLogger.child({});
  if (!session) {
    return logger;
  }
  return logger.child({
    userId: session?.user?.id || 'unknown',
  });
}
