import pino, { stdTimeFunctions } from 'pino'

const formatters = {
  level (label: string) {
      // Set level to string format
      return { level: label.toUpperCase() }
  }
}

export const logger = pino({
  name: `backfill-audio-analyses`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
  formatters
})
