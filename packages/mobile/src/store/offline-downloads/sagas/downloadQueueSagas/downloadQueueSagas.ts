import { requestDownloadQueuedItemSaga } from './requestDownloadQueuedItemSaga'
import { watchAddOfflineItems } from './watchAddOfflineItems'
import { watchReachability } from './watchReachability'

export function downloadQueueSagas() {
  return [
    requestDownloadQueuedItemSaga,
    watchReachability,
    watchAddOfflineItems
  ]
}
