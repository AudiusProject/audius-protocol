import { useMemo } from 'react'

import {
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions,
  useProxySelector
} from '@audius/common'
import { useRoute } from '@react-navigation/native'

import { Lineup } from 'app/components/lineup'

import { EmptyProfileTile } from './EmptyProfileTile'
import type { ProfileTabRoutes } from './routes'
import { useSelectProfile } from './selectors'

const { getProfileFeedLineup } = profilePageSelectors

export const RepostsTab = () => {
  const { params } = useRoute<ProfileTabRoutes<'Reposts'>>()
  const { lazy } = params
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
      lazy={lazy}
      actions={feedActions}
      lineup={lineup}
      limit={repost_count}
      disableTopTabScroll
      LineupEmptyComponent={<EmptyProfileTile tab='reposts' />}
      showsVerticalScrollIndicator={false}
      extraFetchOptions={extraFetchOptions}
    />
  )
}
