import React, { createContext, useRef, RefObject } from 'react'
import WebView from 'react-native-webview'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'

type WebRefContextProps = {
  webRef: RefObject<MessagePostingWebView> | null
}

export const WebRefContext = createContext<WebRefContextProps>({
  webRef: null
})

export const WebRefContextProvider = (props: { children: JSX.Element[] }) => {
  const webRef = useRef<WebView | null>(null)

  return (
    <WebRefContext.Provider value={{ webRef }}>
      {props.children}
    </WebRefContext.Provider>
  )
}
