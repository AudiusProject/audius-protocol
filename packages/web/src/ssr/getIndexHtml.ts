import indexHtml from '../../index.html?raw'

const pattern = /%(\S+?)%/g
const env = process.env

/**
 * Transform index.html so that it can be used for SSR
 * @returns
 */
export const getIndexHtml = () => {
  return (
    indexHtml
      // Replace all %VITE_*% with the corresponding environment variable
      .replace(pattern, (text: string, key) => {
        if (key in env) {
          return env[key] ?? text
        }
        console.warn(`Missing environment variable: ${key}`)
        return text
      })
      // Remove unsupported polyfills that are not needed for SSR
      .replace(/<script id="polyfills".*<\/script>/m, '')
      // Remove index script because it will be added by the server
      .replace(/<script id="index".*<\/script>/m, '')
  )
}
