import commonSagas from './commonSagas'
import { createPlaylistRequestedSaga } from './createPlaylistRequestedSaga'

export default function sagas() {
  return [...commonSagas(), createPlaylistRequestedSaga]
}
