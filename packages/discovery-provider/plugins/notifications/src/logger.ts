import pino, { stdTimeFunctions } from 'pino'

const formatters = {
  level(label: string) {
    // Set level to string format
    return { level: label.toUpperCase() }
  }
}

export const logger = pino({
  name: `notifications`,
  base: undefined,
  timestamp: stdTimeFunctions.isoTime,
  level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  formatters
})
