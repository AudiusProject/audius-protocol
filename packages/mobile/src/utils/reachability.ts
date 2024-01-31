import { reachabilityActions } from '@audius/common/store'

import type { NetInfoState } from '@react-native-community/netinfo'
import NetInfo from '@react-native-community/netinfo'
import { debounce } from 'lodash'
import { AppState } from 'react-native'

import { env } from 'app/env'
import { dispatch } from 'app/store'
import { setCurrentNetworkType } from 'app/store/offline-downloads/slice'

const REACHABILITY_URL = env.REACHABILITY_URL

export const checkNetInfoReachability = (netInfo: NetInfoState | null) => {
  if (!netInfo) return true

  const { isInternetReachable } = netInfo
  return !!isInternetReachable
}

// Check that a response from REACHABILITY_URL is valid
const isResponseValid = (response: Response | undefined) =>
  response && response.ok

export const pingTest = async () => {
  // If there's no reachability url available, consider ourselves reachable
  if (!REACHABILITY_URL) {
    console.warn('No reachability url provided')
    return true
  }

  try {
    const response = await fetch(REACHABILITY_URL, { method: 'GET' })

    if (isResponseValid(response)) {
      console.debug('Reachability call succeeded')
      return true
    }
    console.debug('Reachability call failed')
    return false
  } catch {
    console.debug('Reachability call failed')
    return false
  }
}

const updateReachability = async (netInfoState: NetInfoState) => {
  const newValue = checkNetInfoReachability(netInfoState)
  if (!newValue) {
    // Don't trust offline signal while app is not in focus
    // We check on refocus
    const appState = AppState.currentState
    if (appState !== 'active') return

    // Perform our own reachability test to be extra sure we're offline
    const reachable = await pingTest()
    if (!reachable) {
      setUnreachable(true)
    }
    dispatch(setCurrentNetworkType({ currentNetworkType: netInfoState.type }))
  } else {
    // Supercede the setUnreachable debounce if necessary
    setUnreachable(false)
    dispatch(reachabilityActions.setReachable())
    dispatch(setCurrentNetworkType({ currentNetworkType: netInfoState.type }))
  }
}

/** Debounce calls only for reachable -> unreachable */
const setUnreachable = debounce(
  (isUnreachable: boolean) => {
    if (isUnreachable) {
      dispatch(reachabilityActions.setUnreachable())
    }
  },
  2500,
  { maxWait: 5000 }
)

export const forceRefreshConnectivity = async () => {
  NetInfo.refresh()
  const updatedNetInfoState = await NetInfo.fetch()
  updateReachability(updatedNetInfoState)
}

/** Called on first app render */
export const subscribeToNetworkStatusUpdates = () => {
  NetInfo.addEventListener(updateReachability)
}
