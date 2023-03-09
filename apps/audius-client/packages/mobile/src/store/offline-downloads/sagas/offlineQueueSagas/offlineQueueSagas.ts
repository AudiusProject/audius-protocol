import { requestProcessNextJobSaga } from './requestProccessNextJobSaga'
import { watchAddOfflineEntries } from './watchAddOfflineEntries'
import { watchNetworkType } from './watchNetworkType'

export function offlineQueueSagas() {
  return [requestProcessNextJobSaga, watchNetworkType, watchAddOfflineEntries]
}
