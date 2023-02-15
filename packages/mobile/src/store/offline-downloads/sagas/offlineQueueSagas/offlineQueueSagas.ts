import { requestProcessNextJobSaga } from './requestProccessNextJobSaga'
import { watchAddOfflineEntries } from './watchAddOfflineEntries'
import { watchReachability } from './watchReachability'

export function offlineQueueSagas() {
  return [requestProcessNextJobSaga, watchReachability, watchAddOfflineEntries]
}
