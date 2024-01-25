// For all routes except the explicitly defined ones (Track)
// simply render the SPA without SSR

import { escapeInject, dangerouslySkipEscape } from 'vike/server'

import { getIndexHtml } from 'ssr/getIndexHtml'

export function render() {
  const html = getIndexHtml()
  return escapeInject`${dangerouslySkipEscape(html)}`
}
