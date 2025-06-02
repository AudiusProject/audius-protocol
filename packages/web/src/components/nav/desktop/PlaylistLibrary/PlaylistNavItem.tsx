import { useCallback, useMemo } from 'react'

import { useCollection, useUser } from '@audius/common/api'
import {
  playlistUpdatesActions,
  playlistUpdatesSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import { CollectionNavItem } from './CollectionNavItem'

const { selectPlaylistUpdateById } = playlistUpdatesSelectors
const { updatedPlaylistViewed } = playlistUpdatesActions
const { collectionPage } = route

type PlaylistNavItemProps = {
  playlistId: number
  level: number
  isChild?: boolean
}

export const PlaylistNavItem = (props: PlaylistNavItemProps) => {
  const { playlistId, level, isChild } = props
  const dispatch = useDispatch()

  const playlistName = useSelector(
    (state) => state.account.collections[playlistId]?.name
  )
  const isOwnedByCurrentUser = useSelector(
    (state) =>
      state.account.collections[playlistId]?.user.id === state.account.userId
  )

  const { data: partialPlaylist } = useCollection(playlistId, {
    select: (playlist) => ({
      permalink: playlist.permalink,
      name: playlist.playlist_name,
      ownerId: playlist.playlist_owner_id
    })
  })

  const { data: playlistOwnerHandle } = useUser(partialPlaylist?.ownerId, {
    select: (user) => user.handle
  })
  const playlistUrl = useMemo(
    () =>
      collectionPage(
        playlistOwnerHandle,
        partialPlaylist?.name,
        playlistId,
        partialPlaylist?.permalink
      ),
    [partialPlaylist, playlistOwnerHandle, playlistId]
  )

  const hasPlaylistUpdate = useSelector(
    (state) => !!selectPlaylistUpdateById(state, playlistId)
  )

  const handleClick = useCallback(() => {
    if (hasPlaylistUpdate) {
      dispatch(updatedPlaylistViewed({ playlistId }))
    }
  }, [hasPlaylistUpdate, dispatch, playlistId])

  if (!playlistName || !playlistUrl) return null

  return (
    <CollectionNavItem
      id={playlistId}
      name={playlistName}
      url={playlistUrl}
      isOwned={isOwnedByCurrentUser}
      level={level}
      isChild={isChild}
      hasUpdate={hasPlaylistUpdate}
      onClick={handleClick}
      exact
    />
  )
}
