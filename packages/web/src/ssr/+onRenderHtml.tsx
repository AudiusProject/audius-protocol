import { SsrPageProps } from '@audius/common'
import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageContextServer } from 'vike/types'

import indexHtml from '../../index.html?raw'

export const passToClient = ['pageProps', 'urlPathname']

export default function render(
  pageContext: PageContextServer & { pageProps: SsrPageProps }
) {
  const { Page, pageProps } = pageContext

  const pageHtml = ReactDOMServer.renderToString(
    <>
      {/* @ts-ignore */}
      <Page {...pageProps} />
    </>
  )

  const pattern = /%(\S+?)%/g
  const env = process.env

  // Replace all %VITE_*% with the corresponding environment variable
  const html = indexHtml
    .replace(pattern, (text: string, key) => {
      if (key in env) {
        return env[key] ?? text
      }
      // TODO: throw warning
      return text
    })
    .replace(`<div id="root"></div>`, `<div id="root">${pageHtml}</div>`)

  return escapeInject`${dangerouslySkipEscape(html)}`
}
