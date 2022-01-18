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
    case 'ERROR':
      // console.error triggers an exception and an unpreventable
      // fullscreen LogBox. Logging web app
      // errors as a warning to prevent this
      console.warn(formatted)
      break
    case 'DEBUG':
      console.debug(formatted)
      break
  }
}
