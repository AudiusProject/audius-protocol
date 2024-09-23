import { useCallback } from 'react'

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
}

export const PlaylistNavItem = (props: PlaylistNavItemProps) => {
  const { playlistId, level } = props
  const dispatch = useDispatch()

  const playlistName = useSelector(
    (state) => state.account.collections[playlistId]?.name
  )
  const isOwnedByCurrentUser = useSelector(
    (state) =>
      state.account.collections[playlistId]?.user.id === state.account.userId
  )

  const playlistUrl = useSelector((state) => {
    const playlist = state.account.collections[playlistId]
    if (!playlist) return null
    const { name, user, permalink } = playlist
    const { handle } = user
    return collectionPage(handle, name, playlistId, permalink)
  })

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
      hasUpdate={hasPlaylistUpdate}
      onClick={handleClick}
    />
  )
}
