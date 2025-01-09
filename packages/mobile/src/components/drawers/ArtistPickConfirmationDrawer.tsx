import { useCallback, useMemo } from 'react'

import { useCurrentUser } from '@audius/common/api'
import { tracksSocialActions, useArtistPickModal } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  add: {
    header: 'Set your Artist Pick',
    description:
      'This track will appear at the top of your profile, above your recent uploads, until you change or remove it.',
    confirm: 'Set Track'
  },
  update: {
    header: 'Change your Artist Pick?',
    description:
      'This track will appear at the top of your profile and replace your previously picked track.',
    confirm: 'Change Track'
  },
  remove: {
    header: 'Unset as Artist Pick',
    description:
      'Are you sure you want to remove your pick? This track will be displayed based on its release date.',
    confirm: 'Unset Track'
  }
}

const { setArtistPick, unsetArtistPick } = tracksSocialActions

export const ArtistPickConfirmationDrawer = () => {
  const { data } = useArtistPickModal()
  const { trackId } = data
  const { data: user } = useCurrentUser()

  const dispatch = useDispatch()

  const action = useMemo(
    () => (!user?.artist_pick_track_id ? 'add' : trackId ? 'update' : 'remove'),
    // We don't want optimistic update, otherwise the text changes as the drawer is closing
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackId]
  )

  const handleConfirm = useCallback(() => {
    if (trackId) {
      dispatch(setArtistPick(trackId))
    } else {
      dispatch(unsetArtistPick())
    }
  }, [dispatch, trackId])

  return (
    <ConfirmationDrawer
      variant={action === 'remove' ? 'destructive' : 'affirmative'}
      modalName='ArtistPick'
      messages={messages[action]}
      onConfirm={handleConfirm}
    />
  )
}
