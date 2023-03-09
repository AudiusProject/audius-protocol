import { reachabilityActions, reachabilitySelectors } from '@audius/common'
import { NetInfoStateType } from '@react-native-community/netinfo'
import { select, take } from 'typed-redux-saga'

import {
  getCurrentNetworkType,
  getDownloadNetworkTypePreference
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
    const downloadNetworkTypePreference = yield* select(
      getDownloadNetworkTypePreference
    )
    const isReachable = yield* select(getIsReachable)

    if (!isReachable) return true
    if (currentNetworkType === NetInfoStateType.none) return true

    if (
      currentNetworkType !== NetInfoStateType.wifi &&
      downloadNetworkTypePreference === NetInfoStateType.wifi
    )
      return true
  }
}
