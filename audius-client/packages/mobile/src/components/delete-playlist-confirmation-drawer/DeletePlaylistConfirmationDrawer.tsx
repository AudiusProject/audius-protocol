import { useCallback, useMemo } from 'react'

import {
  cacheCollectionsActions,
  deletePlaylistConfirmationModalUISelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import ActionDrawer from 'app/components/action-drawer'
import { useNavigation } from 'app/hooks/useNavigation'
const { getPlaylistId } = deletePlaylistConfirmationModalUISelectors
const { deletePlaylist } = cacheCollectionsActions

export const DeletePlaylistConfirmationDrawer = () => {
  const playlistId = useSelector(getPlaylistId)
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handleDelete = useCallback(() => {
    if (playlistId) {
      dispatch(deletePlaylist(playlistId))
      navigation.goBack()
    }
  }, [dispatch, playlistId, navigation])

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
