import React, {
  memo,
  ReactNode,
  createContext,
  useRef,
  RefObject,
  useCallback,
  useState,
  useEffect,
  useContext
} from 'react'
import WebView from 'react-native-webview'
import { MessagePostingWebView } from '../../types/MessagePostingWebView'

import { postMessage } from '../../utils/postMessage'
import { MessageType } from '../../message'

type WebRefContextProps = {
  webRef: RefObject<MessagePostingWebView> | null
}

export const WebRefContext = createContext<WebRefContextProps>({
  webRef: null
})

export const WebRefContextProvider = (props: { children: JSX.Element[] }) => {
  const webRef = useRef<WebView|null>(null)

  return (
    <WebRefContext.Provider
      value={{ webRef }}
    >
      {props.children}
    </WebRefContext.Provider>
  )
}
