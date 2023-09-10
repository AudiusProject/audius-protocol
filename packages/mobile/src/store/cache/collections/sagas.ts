import commonSagas from 'common/store/cache/collections/commonSagas'

import { createPlaylistRequestedSaga } from './createPlaylistRequestedSaga'

export default function sagas() {
  return [...commonSagas(), createPlaylistRequestedSaga]
}
