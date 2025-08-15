import React from 'react'

import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { UserCardList } from 'app/components/user-card-list'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'

export const LabelSpotlight = () => {
  const { spacing } = useTheme()
  const { InViewWrapper, inView } = useDeferredElement()

  const { data: exploreContent } = useExploreContent({ enabled: inView })
  const { data: featuredLabels } = useUsers(exploreContent?.featuredLabels, {
    enabled: inView
  })

  return (
    <InViewWrapper>
      <ExploreSection title={messages.labelSpotlight}>
        <UserCardList
          horizontal
          profiles={featuredLabels}
          carouselSpacing={spacing.l}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
