export type LoggerService = {
  createPrefixedLogger: (logPrefix: string) => LoggerService
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}
