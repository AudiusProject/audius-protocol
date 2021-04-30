import { useCallback, useContext } from 'react'
import { WebRefContext } from '../components/web/WebRef'
import { postMessage } from '../utils/postMessage'
import { MessageType } from '../message'

export const useDispatchWebAction = () => {
  const { webRef } = useContext(WebRefContext)
  return useCallback(
    (action: { type: MessageType } & { [key: string]: any }) => {
      if (webRef?.current) {
        postMessage(webRef.current, action)
      }
    },
    [webRef]
  )
}

export const usePushWebRoute = (onLeave?: () => void) => {
  const { webRef } = useContext(WebRefContext)
  return useCallback(
    (route: string, fromPage: string) => {
      if (onLeave) onLeave()
      if (webRef?.current) {
        postMessage(webRef.current, {
          type: MessageType.PUSH_ROUTE,
          route,
          isAction: true,
          fromPage
        })
      }
    },
    [webRef, onLeave]
  )
}
