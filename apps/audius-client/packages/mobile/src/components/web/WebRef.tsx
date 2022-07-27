import type { RefObject, ReactNode } from 'react'
import { createContext, useRef } from 'react'

import type WebView from 'react-native-webview'

import type { MessagePostingWebView } from 'app/types/MessagePostingWebView'

type WebRefContextProps = {
  webRef: RefObject<MessagePostingWebView> | null
}

export const WebRefContext = createContext<WebRefContextProps>({
  webRef: null
})

export const WebRefContextProvider = (props: { children: ReactNode }) => {
  const webRef = useRef<WebView | null>(null)

  return (
    <WebRefContext.Provider value={{ webRef }}>
      {props.children}
    </WebRefContext.Provider>
  )
}
