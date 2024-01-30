import { useCallback } from 'react'

import {
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  deletePlaylistConfirmationModalUISelectors
} from '@audius/common'
import { fillString } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'

import { useDrawerState } from '../drawer'
import { ConfirmationDrawer } from '../drawers'
const { getPlaylistId } = deletePlaylistConfirmationModalUISelectors
const { deletePlaylist } = cacheCollectionsActions
const { getCollection } = cacheCollectionsSelectors

const messages = {
  header: 'Delete Playlist?',
  description: 'Are you sure you want to delete your playlist, %0?',
  confirm: 'Delete',
  cancel: 'Cancel'
}

const modalName = 'DeletePlaylistConfirmation'

export const DeletePlaylistConfirmationDrawer = () => {
  const playlistId = useSelector(getPlaylistId)
  const playlist = useSelector((state) =>
    getCollection(state, { id: playlistId })
  )
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { onClose } = useDrawerState(modalName)

  const handleConfirm = useCallback(() => {
    if (playlistId) {
      dispatch(deletePlaylist(playlistId))
      navigation.goBack()
    }
    onClose()
  }, [dispatch, playlistId, navigation, onClose])

  if (!playlist) return null

  messages.description = fillString(
    messages.description,
    playlist.playlist_name
  )

  return (
    <ConfirmationDrawer
      modalName={modalName}
      messages={messages}
      onConfirm={handleConfirm}
    />
  )
}
