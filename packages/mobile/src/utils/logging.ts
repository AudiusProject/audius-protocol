export type LOG_LEVEL = 'LOG' | 'WARNING' | 'DEBUG' | 'ERROR'

const formatMessage = (message: string | object) => {
  const formatted =
    typeof message === 'object' ? JSON.stringify(message) : message

  return `WebApp: ${formatted}`
}

export const handleWebAppLog = (level: LOG_LEVEL, message: string) => {
  const formatted = formatMessage(message)
  switch (level) {
    case 'LOG':
      console.log(formatted)
      break
    case 'WARNING':
      console.warn(formatted)
      break
    case 'DEBUG':
      console.debug(formatted)
      break
    case 'ERROR':
      console.error(formatted)
      break
  }
}
