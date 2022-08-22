import { explorePageSelectors } from '@audius/common'
import { EXPLORE_PAGE } from 'audius-client/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'
const { makeGetExplore } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Playlists'
}

const getExplore = makeGetExplore()

export const PlaylistsTab = () => {
  const { playlists } = useSelectorWeb(getExplore)

  return (
    <CollectionList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      collection={playlists}
      fromPage={EXPLORE_PAGE}
    />
  )
}
