import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { RemixContestCard } from 'components/remix-contest-card'

import { ExploreSection } from './ExploreSection'

export const FeaturedRemixContestsSection = () => {
  const { data, isLoading } = useExploreContent()

  if (!isLoading && (!data || data.featuredRemixContests.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      isLoading={isLoading}
      title={messages.featuredRemixContests}
      data={data?.featuredRemixContests}
      Card={RemixContestCard}
    />
  )
}
