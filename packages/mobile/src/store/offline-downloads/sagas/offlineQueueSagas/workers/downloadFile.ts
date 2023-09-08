import { CANCEL } from 'redux-saga'
import RNFetchBlob from 'rn-fetch-blob'

// Downloads file from uri to destination, with saga cancellation
export function downloadFile(uri: string, destination: string) {
  const { fetch } = RNFetchBlob.config({ path: destination })
  const fetchTask = fetch('GET', uri)
  fetchTask[CANCEL] = fetchTask.cancel
  return fetchTask
}
