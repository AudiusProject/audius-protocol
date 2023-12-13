// By default, don't do any server side rendering
// Just serve the static HTML

import { escapeInject, dangerouslySkipEscape } from 'vike/server'

import indexHtml from '../index.html?raw'

export function render() {
  const pattern = /%(\S+?)%/g
  const env = process.env

  // Replace all %VITE_*% with the corresponding environment variable
  const html = indexHtml.replace(pattern, (text, key) => {
    if (key in env) {
      return env[key]
    } else {
      // TODO: throw warning
      return text
    }
  })

  return escapeInject`${dangerouslySkipEscape(html)}`
}
