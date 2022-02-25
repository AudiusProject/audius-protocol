import { feedActions } from 'audius-client/src/common/store/pages/profile/lineups/feed/actions'
import { getProfileFeedLineup } from 'audius-client/src/common/store/pages/profile/selectors'

import { EmptyCard, EmptyCardText } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't reposted anything yet"
}

export const RepostsTab = () => {
  const { profile } = useSelectorWeb(getProfile)
  const lineup = useSelectorWeb(getProfileFeedLineup)

  if (!profile) return null

  if (profile.repost_count === 0) {
    return (
      <EmptyCard>
        <EmptyCardText>{messages.emptyTabText}</EmptyCardText>
      </EmptyCard>
    )
  }

  return (
    <Lineup listKey='profile-reposts' actions={feedActions} lineup={lineup} />
  )
}
