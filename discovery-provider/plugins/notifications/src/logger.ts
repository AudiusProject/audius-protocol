import pino, { stdTimeFunctions } from 'pino'

export const logger = pino({
  name: `notifications`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
})
