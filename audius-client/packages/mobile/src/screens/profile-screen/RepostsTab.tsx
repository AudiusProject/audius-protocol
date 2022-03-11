import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { feedActions } from 'audius-client/src/common/store/pages/profile/lineups/feed/actions'
import { getProfileFeedLineup } from 'audius-client/src/common/store/pages/profile/selectors'
import { isEqual } from 'lodash'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'

const getUserFeedMetadatas = makeGetLineupMetadatas(getProfileFeedLineup)

export const RepostsTab = () => {
  const lineup = useSelectorWeb(getUserFeedMetadatas, isEqual)
  const { repost_count } = useSelectProfile(['repost_count'])

  console.log('rerender reposts', repost_count)

  return (
    <Lineup
      listKey='profile-reposts'
      actions={feedActions}
      lineup={lineup}
      selfLoad
      limit={repost_count}
      disableTopTabScroll
      ListEmptyComponent={<EmptyProfileTile tab='reposts' />}
    />
  )
}
