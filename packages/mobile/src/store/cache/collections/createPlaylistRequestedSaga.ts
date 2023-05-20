import { cacheCollectionsActions } from '@audius/common'
import { takeEvery } from 'typed-redux-saga'

import { navigationRef } from 'app/components/navigation-container/NavigationContainer'

export function* createPlaylistRequestedSaga() {
  yield* takeEvery(
    cacheCollectionsActions.CREATE_PLAYLIST_REQUESTED,
    function* (
      action: ReturnType<typeof cacheCollectionsActions.createPlaylistRequested>
    ) {
      const { playlistId } = action
      if (navigationRef.isReady()) {
        // @ts-ignore navigationRef is not parametrized correctly (PAY-1141)
        navigationRef.replace('Collection', { id: playlistId })
      }
    }
  )
}
