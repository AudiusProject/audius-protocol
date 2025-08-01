import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { CollectionCard } from 'components/collection'

import { ExploreSection } from './ExploreSection'

export const FeaturedPlaylistsSection = () => {
  const { data, isLoading } = useExploreContent()

  if (!isLoading && (!data || data.featuredPlaylists.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      isLoading={isLoading}
      title={messages.featuredPlaylists}
      data={data?.featuredPlaylists}
      Card={CollectionCard}
    />
  )
}
