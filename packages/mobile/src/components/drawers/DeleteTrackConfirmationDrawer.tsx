import { useCallback } from 'react'

import { useDeleteTrack } from '@audius/common/api'

import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'

import { navigationRef } from '../navigation-container/NavigationContainer'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  header: 'Delete Track',
  description: 'This Track Will Disappear For Everyone',
  confirm: 'Delete Track',
  cancel: 'Nevermind'
}

const drawerName = 'DeleteTrackConfirmation'

export const DeleteTrackConfirmationDrawer = () => {
  const { data } = useDrawer(drawerName)
  const { trackId } = data
  const navigation = useNavigation()

  const { mutate: deleteTrack } = useDeleteTrack()

  const handleConfirm = useCallback(() => {
    deleteTrack({
      trackId,
      source: 'delete_track_confirmation_drawer'
    })
    const currentRouteName = navigationRef.getCurrentRoute()?.name
    if (currentRouteName === 'Track') {
      navigation.goBack()
    }
  }, [deleteTrack, trackId, navigation])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={messages}
      onConfirm={handleConfirm}
    />
  )
}
