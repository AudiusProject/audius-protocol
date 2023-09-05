import { explorePageSelectors, useProxySelector } from '@audius/common'

import { ArtistCard } from 'app/components/artist-card'
import { CardList } from 'app/components/core'

import { TabInfo } from '../components/TabInfo'
const { getExploreArtists } = explorePageSelectors

const messages = {
  infoHeader: 'Featured Artists'
}

export const ArtistsTab = () => {
  const profiles = useProxySelector(getExploreArtists, [])

  return (
    <CardList
      ListHeaderComponent={<TabInfo header={messages.infoHeader} />}
      data={profiles}
      renderItem={({ item }) => <ArtistCard artist={item} />}
    />
  )
}
