import { useCallback } from 'react'

import { useCollection } from '@audius/common/api'
import {
  cacheCollectionsActions,
  deletePlaylistConfirmationModalUISelectors
} from '@audius/common/store'
import { fillString } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'

import { useDrawerState } from '../drawer'
import { ConfirmationDrawer } from '../drawers'
const { getPlaylistId } = deletePlaylistConfirmationModalUISelectors
const { deletePlaylist } = cacheCollectionsActions

const messages = {
  header: 'Delete Playlist?',
  description: 'Are you sure you want to delete your playlist, %0?',
  confirm: 'Delete',
  cancel: 'Cancel'
}

const modalName = 'DeletePlaylistConfirmation'

export const DeletePlaylistConfirmationDrawer = () => {
  const playlistId = useSelector(getPlaylistId)
  const { data: playlistName } = useCollection(playlistId, {
    select: (collection) => collection.playlist_name
  })
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

  if (!playlistId || !playlistName) return null

  messages.description = fillString(messages.description, playlistName)

  return (
    <ConfirmationDrawer
      modalName={modalName}
      messages={messages}
      onConfirm={handleConfirm}
    />
  )
}
