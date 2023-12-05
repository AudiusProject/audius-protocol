import pino, { stdTimeFunctions } from 'pino'

export const logger = pino({
  name: `es-indexer`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
})
