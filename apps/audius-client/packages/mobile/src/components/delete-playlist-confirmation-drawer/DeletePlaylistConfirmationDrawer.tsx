import { useCallback, useMemo } from 'react'

import {
  cacheCollectionsActions,
  deletePlaylistConfirmationModalUISelectors
} from '@audius/common'

import ActionDrawer from 'app/components/action-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
const { getPlaylistId } = deletePlaylistConfirmationModalUISelectors
const { deletePlaylist } = cacheCollectionsActions

export const DeletePlaylistConfirmationDrawer = () => {
  const playlistId = useSelectorWeb(getPlaylistId)
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()

  const handleDelete = useCallback(() => {
    if (playlistId) {
      dispatchWeb(deletePlaylist(playlistId))
      navigation.goBack()
    }
  }, [dispatchWeb, playlistId, navigation])

  const rows = useMemo(
    () => [
      {
        text: 'Delete',
        isDestructive: true,
        callback: handleDelete
      },
      { text: 'Cancel' }
    ],
    [handleDelete]
  )

  return <ActionDrawer modalName='DeletePlaylistConfirmation' rows={rows} />
}
