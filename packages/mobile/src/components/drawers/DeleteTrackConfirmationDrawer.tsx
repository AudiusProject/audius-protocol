import { cacheTracksActions } from '@audius/common/store'
import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'

import { navigationRef } from '../navigation-container/NavigationContainer'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const { deleteTrack } = cacheTracksActions

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
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handleConfirm = useCallback(() => {
    dispatch(deleteTrack(trackId))
    const currentRouteName = navigationRef.getCurrentRoute()?.name
    if (currentRouteName === 'Track') {
      navigation.goBack()
    }
  }, [dispatch, trackId, navigation])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={messages}
      onConfirm={handleConfirm}
    />
  )
}
