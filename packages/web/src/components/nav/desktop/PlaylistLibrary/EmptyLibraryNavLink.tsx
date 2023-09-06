import { useCallback } from 'react'

import { CreatePlaylistSource, cacheCollectionsActions } from '@audius/common'
import { useDispatch } from 'react-redux'

import { LeftNavLink } from '../LeftNavLink'
const { createPlaylist } = cacheCollectionsActions

const messages = {
  empty: 'Create your first playlist!',
  newPlaylistName: 'New Playlist'
}

export const EmptyLibraryNavLink = () => {
  const dispatch = useDispatch()

  const handleCreatePlaylist = useCallback(() => {
    dispatch(
      createPlaylist(
        { playlist_name: messages.newPlaylistName },
        CreatePlaylistSource.NAV
      )
    )
  }, [dispatch])

  return (
    <LeftNavLink disabled onClick={handleCreatePlaylist}>
      {messages.empty}
    </LeftNavLink>
  )
}
