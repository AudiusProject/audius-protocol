import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export type LOG_LEVEL = 'LOG' | 'WARNING' | 'DEBUG' | 'ERROR'
export class LoggingMessage extends NativeMobileMessage {
  constructor(level: LOG_LEVEL, message: string) {
    super(MessageType.LOGGING, {
      level,
      message
    })
  }
}
