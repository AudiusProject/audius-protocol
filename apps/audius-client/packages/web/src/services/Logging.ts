import { LoggingMessage, LOG_LEVEL } from './native-mobile-interface/logging'

const processConsoleData = (data: any[]) => {
  return data.map((dataItem) => JSON.stringify(dataItem)).join(', ')
}

/**
 * Forwards logs to the mobile client if we're in mobile mode.
 */
export const setupMobileLogging = () => {
  const REACT_APP_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
  if (!REACT_APP_NATIVE_MOBILE) return
  console.log('Setting up mobile logging')

  const handleMessage =
    (level: LOG_LEVEL, original: (...data: any[]) => void) =>
    (...data: any[]) => {
      const nativeMessage = new LoggingMessage(level, processConsoleData(data))
      nativeMessage.send()
      original(...data)
    }

  window.console.log = handleMessage('LOG', window.console.log)
  window.console.info = handleMessage('INFO', window.console.info)
  window.console.debug = handleMessage('DEBUG', window.console.debug)
  window.console.warn = handleMessage('WARNING', window.console.warn)
  window.console.error = handleMessage('ERROR', window.console.error)
}
