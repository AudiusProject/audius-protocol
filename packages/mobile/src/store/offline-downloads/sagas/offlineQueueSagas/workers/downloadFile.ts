import ReactNativeBlobUtil from 'react-native-blob-util'
import { CANCEL } from 'redux-saga'

// Downloads file from uri to destination, with saga cancellation
export function downloadFile(uri: string, destination: string) {
  const { fetch } = ReactNativeBlobUtil.config({ path: destination })
  const fetchTask = fetch('GET', uri)
  fetchTask[CANCEL] = fetchTask.cancel
  return fetchTask
}
