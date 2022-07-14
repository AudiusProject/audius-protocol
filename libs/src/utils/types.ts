export type Maybe<T> = T | undefined
export type Nullable<T> = T | null

export interface Logger {
  /**
   * Write a 'info' level log.
   */
  info: (message: any, ...optionalParams: any[]) => any

  /**
   * Write an 'error' level log.
   */
  error: (message: any, ...optionalParams: any[]) => any

  /**
   * Write a 'warn' level log.
   */
  warn: (message: any, ...optionalParams: any[]) => any

  /**
   * Write a 'debug' level log.
   */
  debug?: (message: any, ...optionalParams: any[]) => any
}
