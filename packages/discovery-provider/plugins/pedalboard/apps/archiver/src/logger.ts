import pino from 'pino'
import pinoHttp from 'pino-http'
import { readConfig } from './config'

const formatters = {
  level(label: string) {
    // Set level to string format
    return { level: label.toUpperCase() }
  }
}

export type LogLevel = pino.LevelWithSilent

const { logLevel } = readConfig()
// set config for logger here
export const logger = pino({
  level: logLevel,
  name: `archiver`,
  formatters,
  errorKey: 'error'
})

export const httpLogger = pinoHttp({ logger })

export type Logger = typeof logger
