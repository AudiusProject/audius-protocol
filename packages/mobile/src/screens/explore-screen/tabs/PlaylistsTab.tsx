import { makeGetExplore } from 'audius-client/src/common/store/pages/explore/selectors'
import { EXPLORE_PAGE } from 'audius-client/src/utils/route'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'

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
