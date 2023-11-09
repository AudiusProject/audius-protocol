import { Collection } from '@audius/common/models/Collection'
import {
  CREATE_PLAYLIST_REQUESTED,
  createPlaylistRequested
} from '@audius/common/store/cache/collections/actions'
import { getCollection } from '@audius/common/store/cache/collections/selectors'
import { toast } from '@audius/common/store/ui/toast/slice'
import { push } from 'connected-react-router'
import { put, select, takeEvery } from 'typed-redux-saga'

const messages = {
  createdToast: 'Playlist Created!',
  view: 'View'
}
// Either route user to created playlist page, or post a toast
export function* createPlaylistRequestedSaga() {
  yield* takeEvery(
    CREATE_PLAYLIST_REQUESTED,
    function* (action: ReturnType<typeof createPlaylistRequested>) {
      const { playlistId, noticeType } = action
      const playlist: Collection = yield* select(getCollection, {
        id: playlistId
      })
      if (!playlist?.permalink) return

      const { permalink } = playlist

      switch (noticeType) {
        case 'toast': {
          yield* put(
            toast({
              content: messages.createdToast,
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
