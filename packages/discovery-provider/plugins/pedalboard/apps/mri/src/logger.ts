import pino from "pino"

const formatters = {
    level (label: string) {
        // Set level to string format
        return { level: label.toUpperCase() }
    }
  }

export const logger = pino({
    name: "mri",
    formatters
})
