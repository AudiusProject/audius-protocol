// TODO: generalize SPA/SSR indexHtml
import indexHtml from './index.html?raw'

const pattern = /%(\S+?)%/g
const env = process.env

export const getIndexHtml = () => {
  // Replace all %VITE_*% with the corresponding environment variable
  return indexHtml.replace(pattern, (text: string, key) => {
    if (key in env) {
      return env[key] ?? text
    }
    console.warn(`Missing environment variable: ${key}`)
    return text
  })
}
