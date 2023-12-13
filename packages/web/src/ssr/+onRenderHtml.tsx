import { SsrPageProps } from '@audius/common'
import { createMemoryHistory } from 'history'
import ReactDOMServer from 'react-dom/server'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import { PageContextServer } from 'vike/types'

import indexHtml from '../../index.html?raw'
import { Root } from '../Root'

import { SsrContextProvider } from './SsrContext'

export const passToClient = ['pageProps', 'urlPathname']

export default function render(
  pageContext: PageContextServer & { pageProps: SsrPageProps }
) {
  const { pageProps, urlPathname } = pageContext

  const history = createMemoryHistory({
    initialEntries: [urlPathname]
  })

  const pageHtml = ReactDOMServer.renderToString(
    <SsrContextProvider
      value={{ path: urlPathname, isServerSide: true, pageProps, history }}
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
