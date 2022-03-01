import { tracksActions } from 'audius-client/src/common/store/pages/profile/lineups/tracks/actions'
import { getProfileTracksLineup } from 'audius-client/src/common/store/pages/profile/selectors'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyProfileTile } from './EmptyProfileTile'
import { getProfile } from './selectors'

export const TracksTab = () => {
  const { profile } = useSelectorWeb(getProfile)
  const lineup = useSelectorWeb(getProfileTracksLineup)

  if (!profile) return null

  if (profile.track_count === 0) {
    return <EmptyProfileTile profile={profile} tab='tracks' />
  }

  return (
    <Lineup
      leadingElementId={profile._artist_pick}
      listKey='profile-tracks'
      actions={tracksActions}
      lineup={lineup}
    />
  )
}
