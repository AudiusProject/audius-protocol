import { reachabilityActions } from '@audius/common'
import type { NetInfoState } from '@react-native-community/netinfo'
import NetInfo from '@react-native-community/netinfo'
import { debounce } from 'lodash'

import { dispatch } from './../store/store'

export const checkConnectivity = (netInfo: NetInfoState | null) => {
  if (!netInfo) return true

  const { isConnected, isInternetReachable, type } = netInfo
  // Unknown type or null reachability means that netinfo hasn't been able to
  // determine connection status. We may actually be connected despite
  // `isConnected` being `false`
  if (type === 'unknown' || isInternetReachable === null) return true
  return isConnected && isInternetReachable
}

// Latest connectivity value
export const Connectivity: { netInfo: NetInfoState | null } = { netInfo: null }

const updateConnectivity = (state: NetInfoState) => {
  Connectivity.netInfo = state
  const newValue = checkConnectivity(state)
  if (!newValue) {
    dispatch(reachabilityActions.setUnreachable())
  } else {
    dispatch(reachabilityActions.setReachable())
  }
}

NetInfo.addEventListener(debounce(updateConnectivity, 2000, { maxWait: 5000 }))
