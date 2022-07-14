import type { ID } from '@audius/common'
import {
  FavoriteSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { CommonState } from 'audius-client/src/common/store'
import { publishPlaylist } from 'audius-client/src/common/store/cache/collections/actions'
import { getCollection } from 'audius-client/src/common/store/cache/collections/selectors'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
// Importing directly from audius-client for now, this will be removed
// when the profile page is implemented in RN
import {
  repostCollection,
  undoRepostCollection,
  saveCollection,
  unsaveCollection,
  shareCollection
} from 'audius-client/src/common/store/social/collections/actions'
import { open as openEditPlaylist } from 'audius-client/src/common/store/ui/createPlaylistModal/actions'
import { requestOpen as openDeletePlaylist } from 'audius-client/src/common/store/ui/delete-playlist-confirmation-modal/slice'
import { getMobileOverflowModal } from 'audius-client/src/common/store/ui/mobile-overflow-menu/selectors'
import {
  OverflowAction,
  OverflowActionCallbacks
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import {
  profilePage,
  playlistPage,
  albumPage
} from 'audius-client/src/utils/route'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

type Props = {
  render: (callbacks: OverflowActionCallbacks) => React.ReactNode
}

const CollectionOverflowMenuDrawer = ({ render }: Props) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID

  const playlist = useSelectorWeb((state: CommonState) =>
    getCollection(state, { id })
  )

  const user = useSelectorWeb((state: CommonState) =>
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
      dispatchWeb(repostCollection(id, RepostSource.OVERFLOW)),
    [OverflowAction.UNREPOST]: () =>
      dispatchWeb(undoRepostCollection(id, RepostSource.OVERFLOW)),
    [OverflowAction.FAVORITE]: () =>
      dispatchWeb(saveCollection(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.UNFAVORITE]: () =>
      dispatchWeb(unsaveCollection(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareCollection(id, ShareSource.OVERFLOW)),
    [OverflowAction.VIEW_ALBUM_PAGE]: () => {
      navigation.navigate({
        native: { screen: 'Collection', params: { id } },
        web: {
          route: (is_album ? albumPage : playlistPage)(
            handle,
            playlist_name,
            id
          )
        }
      })
    },
    [OverflowAction.VIEW_ARTIST_PAGE]: () => {
      navigation.navigate({
        native: { screen: 'Profile', params: { handle } },
        web: { route: profilePage(handle) }
      })
    },
    [OverflowAction.EDIT_PLAYLIST]: () => {
      navigation.navigate({
        native: { screen: 'EditPlaylist', params: { id } }
      })
      dispatchWeb(openEditPlaylist(id))
    },
    [OverflowAction.DELETE_PLAYLIST]: () =>
      dispatchWeb(openDeletePlaylist({ playlistId: id })),
    [OverflowAction.PUBLISH_PLAYLIST]: () =>
      is_album ? () => {} : dispatchWeb(publishPlaylist(id))
  }

  return render(callbacks)
}

export default CollectionOverflowMenuDrawer
