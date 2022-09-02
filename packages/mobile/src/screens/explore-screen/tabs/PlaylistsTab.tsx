import { explorePageSelectors } from '@audius/common'
import { EXPLORE_PAGE } from 'audius-client/src/utils/route'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'

import { TabInfo } from '../components/TabInfo'
const { getExplorePlaylists } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Playlists'
}

export const PlaylistsTab = () => {
  const playlists = useSelector(getExplorePlaylists)

  return (
    <CollectionList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={playlists}
      fromPage={EXPLORE_PAGE}
    />
  )
}
