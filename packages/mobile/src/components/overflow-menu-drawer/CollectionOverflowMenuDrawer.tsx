import type { OverflowActionCallbacks } from '@audius/common/store'
import {
  cacheCollectionsSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
  deletePlaylistConfirmationModalUIActions,
  mobileOverflowMenuUISelectors,
  publishPlaylistConfirmationModalUIActions,
  OverflowAction
} from '@audius/common/store'

import { useContext } from 'react'

import {
  ShareSource,
  RepostSource,
  FavoriteSource
} from '@audius/common/models'
import type { ID } from '@audius/common/models'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
import { AppTabNavigationContext } from 'app/screens/app-screen'
import { setVisibility } from 'app/store/drawers/slice'
import { getIsCollectionMarkedForDownload } from 'app/store/offline-downloads/selectors'

const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { requestOpen: openDeletePlaylist } =
  deletePlaylistConfirmationModalUIActions
const {
  repostCollection,
  undoRepostCollection,
  saveCollection,
  unsaveCollection,
  shareCollection
} = collectionsSocialActions
const { getUser } = cacheUsersSelectors
const { getCollection } = cacheCollectionsSelectors
const { requestOpen: openPublishConfirmation } =
  publishPlaylistConfirmationModalUIActions

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const CollectionOverflowMenuDrawer = ({ render }: Props) => {
  const dispatch = useDispatch()
  const { navigation: contextNavigation } = useContext(AppTabNavigationContext)
  const navigation = useNavigation({ customNavigation: contextNavigation })
  const { id: modalId } = useSelector(getMobileOverflowModal)
  const id = modalId as ID

  const playlist = useSelector((state) => getCollection(state, { id }))
  const isCollectionMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(id)
  )

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
    [OverflowAction.UNFAVORITE]: () => {
      if (isCollectionMarkedForDownload) {
        dispatch(
          setVisibility({
            drawer: 'UnfavoriteDownloadedCollection',
            visible: true,
            data: { collectionId: id }
          })
        )
      } else {
        dispatch(unsaveCollection(id, FavoriteSource.OVERFLOW))
      }
    },
    [OverflowAction.SHARE]: () =>
      dispatch(shareCollection(id, ShareSource.OVERFLOW)),
    [OverflowAction.VIEW_ALBUM_PAGE]: () => {
      navigation?.push('Collection', { id })
    },
    [OverflowAction.VIEW_PLAYLIST_PAGE]: () => {
      navigation?.push('Collection', { id })
    },
    [OverflowAction.VIEW_ARTIST_PAGE]: () => {
      navigation?.push('Profile', { handle })
    },
    [OverflowAction.EDIT_ALBUM]: () => {
      navigation?.push('EditPlaylist', { id })
    },
    [OverflowAction.EDIT_PLAYLIST]: () => {
      navigation?.push('EditPlaylist', { id })
    },
    [OverflowAction.DELETE_ALBUM]: () =>
      dispatch(openDeletePlaylist({ playlistId: id })),
    [OverflowAction.DELETE_PLAYLIST]: () =>
      dispatch(openDeletePlaylist({ playlistId: id })),
    [OverflowAction.PUBLISH_PLAYLIST]: () => {
      return dispatch(openPublishConfirmation({ playlistId: Number(id) }))
    }
  }

  return render(callbacks)
}

export default CollectionOverflowMenuDrawer
