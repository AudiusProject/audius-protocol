import { useCallback } from 'react'

import { tracksActions } from 'audius-client/src/common/store/pages/profile/lineups/tracks/actions'
import { getProfileTracksLineup } from 'audius-client/src/common/store/pages/profile/selectors'
import { Text } from 'react-native'

import { EmptyCard } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't created any tracks yet"
}

export const TracksTab = () => {
  const { profile } = useSelectorWeb(getProfile)
  const lineup = useSelectorWeb(getProfileTracksLineup)
  const dispatchWeb = useDispatchWeb()

  const handlePlayTrack = useCallback(
    (uid: string) => {
      dispatchWeb(tracksActions.play(uid))
    },
    [dispatchWeb]
  )

  const handlePauseTrack = useCallback(() => {
    dispatchWeb(tracksActions.pause())
  }, [dispatchWeb])

  if (!profile) return null

  if (profile.track_count === 0) {
    return (
      <EmptyCard>
        <Text>{messages.emptyTabText}</Text>
      </EmptyCard>
    )
  }

  return (
    <Lineup
      actions={tracksActions}
      lineup={lineup}
      playTrack={handlePlayTrack}
      pauseTrack={handlePauseTrack}
    />
  )
}
