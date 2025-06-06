import { useCallback } from 'react'

import { useCurrentAccount, useCurrentUserId } from '@audius/common/api'
import {
  playlistUpdatesActions,
  playlistUpdatesSelectors
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import { CollectionNavItem } from './CollectionNavItem'

const { selectPlaylistUpdateById } = playlistUpdatesSelectors
const { updatedPlaylistViewed } = playlistUpdatesActions

type PlaylistNavItemProps = {
  playlistId: number
  level: number
  isChild?: boolean
}

export const PlaylistNavItem = (props: PlaylistNavItemProps) => {
  const { playlistId, level, isChild } = props
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()

  const { data: accountCollection } = useCurrentAccount({
    select: (account) => account?.collections?.[playlistId]
  })
  const { name, permalink, user } = accountCollection ?? {}

  const isOwnedByCurrentUser = user?.id === currentUserId

  const hasPlaylistUpdate = useSelector(
    (state) => !!selectPlaylistUpdateById(state, playlistId)
  )

  const handleClick = useCallback(() => {
    if (hasPlaylistUpdate) {
      dispatch(updatedPlaylistViewed({ playlistId }))
    }
  }, [hasPlaylistUpdate, dispatch, playlistId])

  if (!name || !permalink || !user) return null
  return (
    <CollectionNavItem
      id={playlistId}
      name={name}
      url={permalink}
      isOwned={isOwnedByCurrentUser}
      level={level}
      isChild={isChild}
      hasUpdate={hasPlaylistUpdate}
      onClick={handleClick}
      exact
    />
  )
}
