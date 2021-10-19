import { useCallback } from 'react'
import { MessageType } from 'audius-client/src/services/native-mobile-interface/types'

import { useDispatchWeb } from './useDispatchWeb'

export const usePushRouteWeb = (onLeave?: () => void) => {
  const dispatchWeb = useDispatchWeb()
  return useCallback(
    (route: string, fromPage: string) => {
      if (onLeave) onLeave()
      dispatchWeb({
        type: MessageType.PUSH_ROUTE,
        route,
        fromPage
      })
    },
    [dispatchWeb, onLeave]
  )
}
