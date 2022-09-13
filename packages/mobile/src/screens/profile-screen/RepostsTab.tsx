import {
  lineupSelectors,
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions
} from '@audius/common'
import { useSelector } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'

const { getProfileFeedLineup } = profilePageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getUserFeedMetadatas = makeGetLineupMetadatas(getProfileFeedLineup)

export const RepostsTab = () => {
  const lineup = useSelector(getUserFeedMetadatas)
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
