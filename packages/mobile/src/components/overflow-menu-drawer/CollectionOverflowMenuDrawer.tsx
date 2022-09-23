import type { ID, OverflowActionCallbacks } from '@audius/common'
import {
  FavoriteSource,
  RepostSource,
  ShareSource,
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
  createPlaylistModalUIActions,
  deletePlaylistConfirmationModalUIActions,
  OverflowAction,
  mobileOverflowMenuUISelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { requestOpen: openDeletePlaylist } =
  deletePlaylistConfirmationModalUIActions
const { open: openEditPlaylist } = createPlaylistModalUIActions
const {
  repostCollection,
  undoRepostCollection,
  saveCollection,
  unsaveCollection,
  shareCollection
} = collectionsSocialActions
const { getUser } = cacheUsersSelectors
const { getCollection } = cacheCollectionsSelectors
const { publishPlaylist } = cacheCollectionsActions

type Props = {
  render: (callbacks: OverflowActionCallbacks) => React.ReactNode
}

const CollectionOverflowMenuDrawer = ({ render }: Props) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { id: modalId } = useSelector(getMobileOverflowModal)
  const id = modalId as ID

  const playlist = useSelector((state) => getCollection(state, { id }))

  const user = useSelector((state) =>
    getUser(state, { id: playlist?.playlist_owner_id })
  )

  if (!playlist || !user) {
    return null
  }
  const { playlist_name, is_album } = playlist
  const { handle } = user

  if (!id || !handle || !playlist_name || is_album === undefined) {
    return null
  }

  const callbacks = {
    [OverflowAction.REPOST]: () =>
      dispatch(repostCollection(id, RepostSource.OVERFLOW)),
    [OverflowAction.UNREPOST]: () =>
      dispatch(undoRepostCollection(id, RepostSource.OVERFLOW)),
    [OverflowAction.FAVORITE]: () =>
      dispatch(saveCollection(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.UNFAVORITE]: () =>
      dispatch(unsaveCollection(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatch(shareCollection(id, ShareSource.OVERFLOW)),
    [OverflowAction.VIEW_ALBUM_PAGE]: () => {
      navigation.navigate('Collection', { id })
    },
    [OverflowAction.VIEW_PLAYLIST_PAGE]: () => {
      navigation.navigate('Collection', { id })
    },
    [OverflowAction.VIEW_ARTIST_PAGE]: () => {
      navigation.navigate('Profile', { handle })
    },
    [OverflowAction.EDIT_PLAYLIST]: () => {
      navigation.navigate('EditPlaylist', { id })
      dispatch(openEditPlaylist(id))
    },
    [OverflowAction.DELETE_PLAYLIST]: () =>
      dispatch(openDeletePlaylist({ playlistId: id })),
    [OverflowAction.PUBLISH_PLAYLIST]: () =>
      is_album ? () => {} : dispatch(publishPlaylist(Number(id)))
  }

  return render(callbacks)
}

export default CollectionOverflowMenuDrawer
