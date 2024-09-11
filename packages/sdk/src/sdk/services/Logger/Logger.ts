import type { LoggerService } from './types'

const DEFAULT_LOG_LEVEL = 'warn'
const DEFAULT_LOG_PREFIX = '[audius-sdk]'
const logLevels = ['debug', 'info', 'warn', 'error'] as const

type LogLevel = (typeof logLevels)[number]

type LoggerConfiguration = {
  logLevel?: LogLevel
  logPrefix?: string
}

export class Logger implements LoggerService {
  private logLevel: LogLevel
  private logPrefix = '[audius-sdk]'

  constructor(config?: LoggerConfiguration) {
    this.logLevel = config?.logLevel ?? DEFAULT_LOG_LEVEL
    this.logPrefix = config?.logPrefix ?? DEFAULT_LOG_PREFIX
  }

  public createPrefixedLogger(logPrefix: string) {
    return new Logger({
      logLevel: this.logLevel,
      logPrefix: `${this.logPrefix}${logPrefix}`
    })
  }

  public debug(...args: any[]) {
    if (logLevels.indexOf(this.logLevel) > logLevels.indexOf('debug')) {
      return
    }
    console.debug(this.logPrefix, ...args)
  }

  public info(...args: any[]) {
    if (logLevels.indexOf(this.logLevel) > logLevels.indexOf('info')) {
      return
    }
    console.info(this.logPrefix, ...args)
  }

  public warn(...args: any[]) {
    if (logLevels.indexOf(this.logLevel) > logLevels.indexOf('warn')) {
      return
    }
    console.warn(this.logPrefix, ...args)
  }

  public error(...args: any[]) {
    if (logLevels.indexOf(this.logLevel) > logLevels.indexOf('error')) {
      return
    }
    console.error(this.logPrefix, ...args)
  }
}
