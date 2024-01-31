import {
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  toastActions
} from '@audius/common/store'

import { push } from 'connected-react-router'
import { put, select, takeEvery } from 'typed-redux-saga'

const { toast } = toastActions
const { getCollection } = cacheCollectionsSelectors

const messages = {
  createdToast: (isAlbum: boolean) =>
    `${isAlbum ? 'Album' : 'Playlist'} Created`,
  view: 'View'
}
// Either route user to created playlist page, or post a toast
export function* createPlaylistRequestedSaga() {
  yield* takeEvery(
    cacheCollectionsActions.CREATE_PLAYLIST_REQUESTED,
    function* (
      action: ReturnType<typeof cacheCollectionsActions.createPlaylistRequested>
    ) {
      const { playlistId, noticeType, isAlbum } = action
      const playlist = yield* select(getCollection, { id: playlistId })
      if (!playlist?.permalink) return

      const { permalink } = playlist

      switch (noticeType) {
        case 'toast': {
          yield* put(
            toast({
              content: messages.createdToast(isAlbum),
              linkText: messages.view,
              link: permalink
            })
          )
          break
        }
        case 'route': {
          yield* put(push(permalink))
          break
        }
      }
    }
  )
}
