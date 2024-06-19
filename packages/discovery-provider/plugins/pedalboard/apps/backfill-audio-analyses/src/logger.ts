import pino, { stdTimeFunctions } from 'pino'

export const logger = pino({
  name: `backfill-audio-analyses`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime
})
