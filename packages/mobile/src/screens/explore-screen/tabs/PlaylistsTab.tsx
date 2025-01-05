import { useFeaturedPlaylists } from '@audius/common/api'

import { CollectionList } from 'app/components/collection-list'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Playlists'
}

export const FeaturedPlaylistsTab = () => {
  const { data: playlists = [], isLoading } = useFeaturedPlaylists()

  return (
    <CollectionList
      isLoading={isLoading}
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={playlists}
    />
  )
}
