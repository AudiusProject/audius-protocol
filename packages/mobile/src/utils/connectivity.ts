import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

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
NetInfo.addEventListener((state: NetInfoState) => {
  Connectivity.netInfo = state
})
