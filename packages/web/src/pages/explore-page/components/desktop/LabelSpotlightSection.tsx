import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { UserCard } from 'components/user-card'

import { ExploreSection } from './ExploreSection'

export const LabelSpotlightSection = () => {
  const { data, isLoading } = useExploreContent()

  if (!isLoading && (!data || data.featuredLabels.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      isLoading={isLoading}
      title={messages.labelSpotlight}
      data={data?.featuredLabels}
      Card={UserCard}
    />
  )
}
