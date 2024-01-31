import {
  reachabilityActions,
  reachabilitySelectors
} from '@audius/common/store'
import { NetInfoStateType } from '@react-native-community/netinfo'
import { select, take } from 'typed-redux-saga'

import {
  getCurrentNetworkType,
  getPreferredDownloadNetworkType
} from '../../selectors'
import {
  setCurrentNetworkType,
  setDownloadNetworkPreference
} from '../../slice'
const { SET_UNREACHABLE } = reachabilityActions
const { getIsReachable } = reachabilitySelectors

export function* shouldCancelJob() {
  while (true) {
    yield* take([
      setCurrentNetworkType,
      setDownloadNetworkPreference,
      SET_UNREACHABLE
    ])
    const currentNetworkType = yield* select(getCurrentNetworkType)
    const preferredDownloadNetworkType = yield* select(
      getPreferredDownloadNetworkType
    )
    const isReachable = yield* select(getIsReachable)

    if (!isReachable) return true
    if (currentNetworkType === NetInfoStateType.none) return true

    if (
      currentNetworkType !== NetInfoStateType.wifi &&
      preferredDownloadNetworkType === NetInfoStateType.wifi
    )
      return true
  }
}
