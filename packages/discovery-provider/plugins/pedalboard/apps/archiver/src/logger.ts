import pino from 'pino'

const formatters = {
  level(label: string) {
    // Set level to string format
    return { level: label.toUpperCase() }
  }
}

// set config for logger here
export const logger = pino({
  name: `archiver`,
  formatters
})
