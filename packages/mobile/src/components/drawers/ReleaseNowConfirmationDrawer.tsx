import { useCallback } from 'react'

import { cacheTracksActions, useGetTrackById } from '@audius/common'
import moment from 'moment'
import { useDispatch } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'

import { navigationRef } from '../navigation-container/NavigationContainer'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const { editTrack } = cacheTracksActions

const messages = {
  header: 'Confirm Release',
  description:
    'Ready to release your new track? Your followers will be notified and your track will be released to the public.',
  confirm: 'Release Now',
  cancel: 'Cancel'
}

const drawerName = 'ReleaseNowConfirmation'

export const ReleaseNowConfirmationDrawer = () => {
  const { data } = useDrawer(drawerName)
  const { trackId } = data
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
  const handleConfirm = useCallback(() => {
    if (track) {
      track.is_unlisted = false
      track.release_date = moment().toString()
      dispatch(editTrack(trackId, track))
    }

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
