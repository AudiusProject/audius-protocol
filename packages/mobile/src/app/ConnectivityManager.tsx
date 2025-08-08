import { useEnterForeground } from 'app/hooks/useAppState'
import { forceRefreshConnectivity } from 'app/utils/reachability'

/**
 * Component that handles connectivity refresh when app enters foreground.
 * Separated from main App component to prevent unnecessary rerenders.
 */
export const ConnectivityManager = () => {
  useEnterForeground(() => {
    forceRefreshConnectivity()
  })

  return null
}
