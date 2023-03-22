import pino, { stdTimeFunctions, levels } from 'pino'

export const logger = pino({
  name: `notifications`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
  level: process.env.NODE_ENV === 'test' ? 'error' : 'info'
})
