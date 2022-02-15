import { useCallback } from 'react'

import { feedActions } from 'audius-client/src/common/store/pages/profile/lineups/feed/actions'
import { getProfileFeedLineup } from 'audius-client/src/common/store/pages/profile/selectors'
import { Text } from 'react-native'

import { EmptyCard } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't reposted anything yet"
}

export const RepostsTab = () => {
  const { profile } = useSelectorWeb(getProfile)
  const lineup = useSelectorWeb(getProfileFeedLineup)
  const dispatchWeb = useDispatchWeb()

  const handlePlayTrack = useCallback(
    (uid: string) => {
      dispatchWeb(feedActions.play(uid))
    },
    [dispatchWeb]
  )

  const handlePauseTrack = useCallback(() => {
    dispatchWeb(feedActions.pause())
  }, [dispatchWeb])

  if (!profile) return null

  if (profile.repost_count === 0) {
    return (
      <EmptyCard>
        <Text>{messages.emptyTabText}</Text>
      </EmptyCard>
    )
  }

  return (
    <Lineup
      listKey='profile-reposts'
      actions={feedActions}
      lineup={lineup}
      playTrack={handlePlayTrack}
      pauseTrack={handlePauseTrack}
    />
  )
}
