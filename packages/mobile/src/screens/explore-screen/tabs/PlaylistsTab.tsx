import { Status, explorePageSelectors, useProxySelector } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'

import { TabInfo } from '../components/TabInfo'
const { getExplorePlaylists, getExploreStatus } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Playlists'
}

export const PlaylistsTab = () => {
  const playlists = useProxySelector(getExplorePlaylists, [])
  const exploreStatus = useSelector(getExploreStatus)

  return (
    <CollectionList
      isLoading={exploreStatus === Status.LOADING}
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={playlists}
    />
  )
}
