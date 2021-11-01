import { useCallback, useContext } from 'react'
import { WebRefContext } from '../components/web/WebRef'
import { postMessage } from '../utils/postMessage'

// When mobile-client is no longer dependent on the web client
// calls to useDispatchWeb can be replaced with useDispatch
export const useDispatchWeb = () => {
  const { webRef } = useContext(WebRefContext)
  return useCallback(
    (action: { type: string; [key: string]: any }) => {
      if (webRef?.current) {
        postMessage(webRef.current, { isAction: true, ...action })
      }
    },
    [webRef]
  )
}
