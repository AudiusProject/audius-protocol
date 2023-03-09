import { reachabilityActions, reachabilitySelectors } from '@audius/common'
import { NetInfoStateType } from '@react-native-community/netinfo'
import { put, select, takeEvery } from 'typed-redux-saga'

import {
  getCurrentNetworkType,
  getDownloadNetworkTypePreference,
  getOfflineQueue,
  getQueueStatus
} from '../../selectors'
import {
  QueueStatus,
  requestProcessNextJob,
  setCurrentNetworkType,
  setDownloadNetworkPreference,
  updateQueueStatus
} from '../../slice'

const { SET_UNREACHABLE, SET_REACHABLE } = reachabilityActions
const { getIsReachable } = reachabilitySelectors

export function* watchNetworkType() {
  yield* takeEvery(
    [
      setCurrentNetworkType,
      setDownloadNetworkPreference,
      SET_UNREACHABLE,
      SET_REACHABLE
    ],
    function* handleNetworkTypeChange() {
      const currentNetworkType = yield* select(getCurrentNetworkType)
      const downloadNetworkTypePreference = yield* select(
        getDownloadNetworkTypePreference
      )
      const isReachable = yield* select(getIsReachable)
      const downloadQueue = yield* select(getOfflineQueue)
      const queueStatus = yield* select(getQueueStatus)

      const isDownloadDisabled =
        !isReachable ||
        currentNetworkType === NetInfoStateType.none ||
        (currentNetworkType !== NetInfoStateType.wifi &&
          downloadNetworkTypePreference === NetInfoStateType.wifi)

      if (isDownloadDisabled) {
        if (queueStatus !== QueueStatus.PAUSED) {
          yield* put(updateQueueStatus({ queueStatus: QueueStatus.PAUSED }))
        }
      } else {
        if (downloadQueue.length > 0 && queueStatus === QueueStatus.PAUSED) {
          yield* put(updateQueueStatus({ queueStatus: QueueStatus.PROCESSING }))
          yield* put(requestProcessNextJob())
        }
      }
    }
  )
}
