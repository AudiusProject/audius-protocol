import { cacheCollectionsActions, toastActions, uuid } from '@audius/common'
import { put, takeEvery } from 'typed-redux-saga'

import { navigationRef } from 'app/components/navigation-container/NavigationContainer'

const { registerToast } = toastActions

const messages = {
  createdToast: 'Playlist Created!',
  view: 'View'
}

export function* createPlaylistRequestedSaga() {
  yield* takeEvery(
    cacheCollectionsActions.CREATE_PLAYLIST_REQUESTED,
    function* (
      action: ReturnType<typeof cacheCollectionsActions.createPlaylistRequested>
    ) {
      const { playlistId, noticeType } = action

      switch (noticeType) {
        case 'toast': {
          yield* put(
            registerToast({
              content: messages.createdToast,
              key: uuid(),
              linkText: messages.view,
              linkConfig: { screen: 'Collection', params: { id: playlistId } }
            })
          )
          break
        }
        case 'route': {
          if (navigationRef.isReady()) {
            // @ts-ignore navigationRef is not parametrized correctly (PAY-1141)
            navigationRef.navigate('Collection', { id: playlistId })
          }
          break
        }
      }
    }
  )
}
