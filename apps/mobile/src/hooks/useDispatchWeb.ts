import { useCallback } from 'react'

// When mobile-client is no longer dependent on the web client
// calls to useDispatchWeb can be replaced with useDispatch
export const useDispatchWeb = () => {
  return useCallback((_action: { type: string; [key: string]: any }) => {
    throw new Error(
      'useDispatchWeb not implemented, convert usage to useDispatch'
    )
  }, [])
}
