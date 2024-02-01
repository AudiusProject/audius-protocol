import { useProxySelector } from '@audius/common/hooks'
import { reachabilitySelectors } from '@audius/common/store'

import type { AppState } from 'app/store'
import {
  getIsDoneLoadingFromDisk,
  getOfflineTrackStatus
} from 'app/store/offline-downloads/selectors'

const { getIsReachable } = reachabilitySelectors

const emptyTrackStatus = {}

type UseOfflineTrackStatusConfig = {
  /* Return empty if we are online. Useful as a performance optimization */
  skipIfOnline?: boolean
}

/** Returns a mapping of tracks to their offline download status. Can be configured
 * to skip updates when online as a performance optimization
 */
export function useOfflineTracksStatus({
  skipIfOnline = false
}: UseOfflineTrackStatusConfig = {}) {
  return useProxySelector(
    (state: AppState) => {
      const isReachable = getIsReachable(state)
      const isDoneLoadingFromDisk = getIsDoneLoadingFromDisk(state)

      const skipUpdate = skipIfOnline && isReachable
      if (skipUpdate || !isDoneLoadingFromDisk) {
        return emptyTrackStatus
      }
      return getOfflineTrackStatus(state)
    },
    [skipIfOnline]
  )
}
