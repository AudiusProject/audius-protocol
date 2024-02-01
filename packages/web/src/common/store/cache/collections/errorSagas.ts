import { cacheCollectionsActions } from '@audius/common/store'

import { createErrorSagas } from 'utils/errorSagas'

type CollectionErrors =
  | ReturnType<typeof cacheCollectionsActions.createPlaylistFailed>
  | ReturnType<typeof cacheCollectionsActions.editPlaylistFailed>
  | ReturnType<typeof cacheCollectionsActions.addTrackToPlaylistFailed>
  | ReturnType<typeof cacheCollectionsActions.removeTrackFromPlaylistFailed>
  | ReturnType<typeof cacheCollectionsActions.orderPlaylistFailed>
  | ReturnType<typeof cacheCollectionsActions.deletePlaylistFailed>
  | ReturnType<typeof cacheCollectionsActions.publishPlaylistFailed>

const errorSagas = createErrorSagas<CollectionErrors>({
  errorTypes: [
    cacheCollectionsActions.CREATE_PLAYLIST_FAILED,
    cacheCollectionsActions.EDIT_PLAYLIST_FAILED,
    cacheCollectionsActions.ADD_TRACK_TO_PLAYLIST_FAILED,
    cacheCollectionsActions.REMOVE_TRACK_FROM_PLAYLIST_FAILED,
    cacheCollectionsActions.ORDER_PLAYLIST_FAILED,
    cacheCollectionsActions.DELETE_PLAYLIST_FAILED,
    cacheCollectionsActions.PUBLISH_PLAYLIST_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: CollectionErrors) => ({
    error: action.error,
    params: action.params,
    metadata: action.metadata
  })
})

export default errorSagas
