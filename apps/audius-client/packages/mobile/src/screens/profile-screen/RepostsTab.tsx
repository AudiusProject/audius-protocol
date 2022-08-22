import {
  lineupSelectors,
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions
} from '@audius/common'

import { Lineup } from 'app/components/lineup'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'

const { getProfileFeedLineup } = profilePageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getUserFeedMetadatas = makeGetLineupMetadatas(getProfileFeedLineup)

export const RepostsTab = () => {
  const lineup = useSelectorWeb(getUserFeedMetadatas, isEqual)
  const { repost_count } = useSelectProfile(['repost_count'])

  return (
    <Lineup
      listKey='profile-reposts'
      actions={feedActions}
      lineup={lineup}
      selfLoad
      limit={repost_count}
      disableTopTabScroll
      ListEmptyComponent={<EmptyProfileTile tab='reposts' />}
      showsVerticalScrollIndicator={false}
    />
  )
}
