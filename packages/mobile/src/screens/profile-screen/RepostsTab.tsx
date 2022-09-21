import { useMemo } from 'react'

import {
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions,
  useProxySelector
} from '@audius/common'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'

const { getProfileFeedLineup } = profilePageSelectors

export const RepostsTab = () => {
  const { handle } = useSelectProfile(['handle'])
  const lineup = useProxySelector(
    (state) => getProfileFeedLineup(state, handle),
    [handle]
  )
  const { repost_count } = useSelectProfile(['repost_count'])

  const extraFetchOptions = useMemo(() => ({ handle }), [handle])

  if (!lineup) return null

  return (
    <Lineup
      listKey='profile-reposts'
      selfLoad
      actions={feedActions}
      lineup={lineup}
      limit={repost_count}
      disableTopTabScroll
      ListEmptyComponent={<EmptyProfileTile tab='reposts' />}
      showsVerticalScrollIndicator={false}
      extraFetchOptions={extraFetchOptions}
    />
  )
}
