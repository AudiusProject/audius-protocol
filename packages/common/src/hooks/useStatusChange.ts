import { useEffect } from 'react'

import { usePrevious } from 'react-use'

import { Status } from '~/models'

// This hook is used to trigger callbacks whenever a certain status change happens
// Saves some boilerplate code
// Note: by default it calls the callbacks whenever the status is reached regardless of which state was previous
// If you need more specific behavior (e.g. changes only from LOADING to SUCCESS) - use the prevStatus arg
export const useStatusChange = (
  status: Status,
  {
    onLoad,
    onSuccess,
    onError,
    onIdle
  }: {
    onLoad?: (prevStatus: Status) => void
    onSuccess?: (prevStatus: Status) => void
    onError?: (prevStatus: Status) => void
    onIdle?: (prevStatus: Status) => void // Note: this doesnt call on first idle init; only on subsequent ones
  }
) => {
  const prevStatus = usePrevious(status)
  useEffect(() => {
    // Prev status is undefined on first render before going to IDLE
    if (prevStatus !== status && prevStatus !== undefined) {
      if (status === Status.LOADING) {
        onLoad?.(prevStatus)
      }
      if (status === Status.SUCCESS) {
        onSuccess?.(prevStatus)
      }
      if (status === Status.ERROR) {
        onError?.(prevStatus)
      }
      if (status === Status.IDLE) {
        onIdle?.(prevStatus)
      }
    }
  }, [status, prevStatus, onLoad, onSuccess, onError, onIdle])
}
