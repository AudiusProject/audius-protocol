import React from 'react'

import { useCollections, useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'

export const FeaturedPlaylists = () => {
  const { spacing } = useTheme()
  const { InViewWrapper, inView } = useDeferredElement()

  const { data: exploreContent } = useExploreContent({ enabled: inView })
  const { data: playlists } = useCollections(
    exploreContent?.featuredPlaylists,
    { enabled: inView }
  )

  return (
    <InViewWrapper>
      <ExploreSection title={messages.featuredPlaylists}>
        <CollectionList
          horizontal
          collectionIds={playlists?.map((playlist) => playlist.playlist_id)}
          carouselSpacing={spacing.l}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
