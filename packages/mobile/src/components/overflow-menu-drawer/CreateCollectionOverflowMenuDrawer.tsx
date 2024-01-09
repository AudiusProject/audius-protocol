import type { OverflowActionCallbacks } from '@audius/common'
import {
  OverflowAction,
  CreatePlaylistSource,
  cacheCollectionsActions
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'

const { createAlbum, createPlaylist } = cacheCollectionsActions

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const CreateCollectionOverflowMenuDrawer = ({ render }: Props) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const callbacks = {
    [OverflowAction.CREATE_ALBUM]: () =>
      dispatch(
        createAlbum(
          { playlist_name: `New Album` },
          CreatePlaylistSource.PROFILE_PAGE
        )
      ),
    [OverflowAction.CREATE_PLAYLIST]: () => {
      dispatch(
        createPlaylist(
          { playlist_name: `New Playlist` },
          CreatePlaylistSource.PROFILE_PAGE
        )
      )
    },
    [OverflowAction.UPLOAD_ALBUM]: () => navigation.push('Upload'),
    [OverflowAction.UPLOAD_PLAYLIST]: () => {
      navigation.push('Upload')
    }
  }

  return render(callbacks)
}

export default CreateCollectionOverflowMenuDrawer
