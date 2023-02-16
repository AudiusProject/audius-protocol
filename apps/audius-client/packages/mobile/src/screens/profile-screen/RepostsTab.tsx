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
  const { handle, repost_count } = useSelectProfile(['handle', 'repost_count'])
  const handleLower = handle.toLowerCase()

  const lineup = useProxySelector(
    (state) => getProfileFeedLineup(state, handleLower),
    [handleLower]
  )

  const extraFetchOptions = useMemo(
    () => ({ handle: handleLower }),
    [handleLower]
  )

  return (
    <Lineup
      listKey='profile-reposts'
      selfLoad
      lazy
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
