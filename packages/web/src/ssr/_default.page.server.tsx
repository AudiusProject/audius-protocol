import { SsrPageProps } from '@audius/common'
import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageContextServer } from 'vike/types'

import history from 'utils/history'

import indexHtml from '../../index.html?raw'
import { Root } from '../Root'

import { SsrContextProvider } from './SsrContext'

export const passToClient = ['pageProps', 'urlPathname']

export function render(
  pageContext: PageContextServer & { pageProps: SsrPageProps }
) {
  const { Page, pageProps, urlPathname } = pageContext

  // TODO: Shared history instance is causing page not to change on new route
  history.replace(urlPathname)

  const pageHtml = ReactDOMServer.renderToString(
    <SsrContextProvider
      value={{ path: urlPathname, isServerSide: true, pageProps }}
    >
      <Root />
    </SsrContextProvider>
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
