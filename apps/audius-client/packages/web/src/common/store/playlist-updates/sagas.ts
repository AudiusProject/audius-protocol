import { watchUpdatedPlaylistViewedSaga } from './updatedPlaylistViewedSaga'

export default function sagas() {
  return [watchUpdatedPlaylistViewedSaga()]
}
