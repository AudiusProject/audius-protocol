import { feedActions } from 'audius-client/src/common/store/pages/profile/lineups/feed/actions'

import { Lineup } from 'app/components/lineup'
import { useProfile } from 'app/hooks/selectors'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useProfileFeedLineup } from './selectors'

export const RepostsTab = () => {
  const profile = useProfile()
  const lineup = useProfileFeedLineup()

  if (!profile) return null

  if (profile.repost_count === 0) {
    return <EmptyProfileTile profile={profile} tab='reposts' />
  }

  return (
    <Lineup
      listKey='profile-reposts'
      actions={feedActions}
      lineup={lineup}
      selfLoad
      disableTopTabScroll
    />
  )
}
