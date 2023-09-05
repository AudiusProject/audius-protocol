import type { UserCollection } from '@audius/common'
import { explorePageSelectors, useProxySelector } from '@audius/common'

import { CollectionList } from 'app/components/collection-list'

import { TabInfo } from '../components/TabInfo'
const { getExplorePlaylists } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Playlists'
}

export const PlaylistsTab = () => {
  const playlists = useProxySelector(getExplorePlaylists, [])

  return (
    <CollectionList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={playlists as UserCollection[]}
    />
  )
}
