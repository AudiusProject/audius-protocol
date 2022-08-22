import { explorePageSelectors } from '@audius/common'
import { EXPLORE_PAGE } from 'audius-client/src/utils/route'

import { ArtistCard } from 'app/components/artist-card'
import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { TabInfo } from '../components/TabInfo'
const { makeGetExplore } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Artists'
}

const getExplore = makeGetExplore()

export const ArtistsTab = () => {
  const { profiles } = useSelectorWeb(getExplore)

  return (
    <CardList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      data={profiles}
      renderItem={({ item }) => (
        <ArtistCard artist={item} fromPage={EXPLORE_PAGE} />
      )}
    />
  )
}
