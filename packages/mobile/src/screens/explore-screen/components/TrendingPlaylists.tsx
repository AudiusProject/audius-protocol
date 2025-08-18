import React from 'react'

import { useTrendingPlaylists } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { trendingPlaylistsPageLineupActions } from '@audius/common/store'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { CollectionLineupCarousel } from './CollectionLineupCarousel'
import { ExploreSection } from './ExploreSection'

export const TrendingPlaylists = () => {
  const { InViewWrapper, inView } = useDeferredElement()
  const { lineup } = useTrendingPlaylists({ pageSize: 5 }, { enabled: inView })

  return (
    <InViewWrapper>
      <ExploreSection
        title={messages.trendingPlaylists}
        viewAllLink='TrendingPlaylists'
      >
        <CollectionLineupCarousel
          lineup={lineup}
          isTrending
          actions={trendingPlaylistsPageLineupActions}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
