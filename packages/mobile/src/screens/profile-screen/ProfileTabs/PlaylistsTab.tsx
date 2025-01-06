import { useUserPlaylists } from '@audius/common/api'
import { CreatePlaylistSource } from '@audius/common/models'
import { useIsFocused } from '@react-navigation/native'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { spacing } from 'app/styles/spacing'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { getIsOwner, useSelectProfile } from '../selectors'

const emptyPlaylists = []

export const PlaylistsTab = () => {
  const { handle, playlist_count, user_id } = useSelectProfile([
    'handle',
    'playlist_count',
    'user_id'
  ])
  const isOwner = useSelector((state) => getIsOwner(state, handle ?? ''))
  const isFocused = useIsFocused()

  const { data: playlists, isLoading } = useUserPlaylists(
    { userId: user_id },
    { enabled: isFocused }
  )

  return (
    <CollectionList
      collection={playlist_count > 0 || isOwner ? playlists : emptyPlaylists}
      style={{ paddingTop: spacing(3) }}
      ListEmptyComponent={
        <EmptyProfileTile tab='playlists' style={{ marginTop: 0 }} />
      }
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
      totalCount={playlist_count}
      showCreateCollectionTile={isOwner}
      createPlaylistSource={CreatePlaylistSource.PROFILE_PAGE}
      isLoading={isLoading}
    />
  )
}
