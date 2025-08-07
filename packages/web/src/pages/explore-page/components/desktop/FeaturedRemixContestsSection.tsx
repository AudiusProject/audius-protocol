import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { RemixContestCard } from 'components/remix-contest-card'
import { useIsMobile } from 'hooks/useIsMobile'

import { ExploreSection } from './ExploreSection'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const FeaturedRemixContestsContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useExploreContent({ enabled: visible })
  const isMobile = useIsMobile()

  return (
    <>
      {!visible || !data?.featuredRemixContests || isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            // loading skeletons
            <RemixContestCard key={i} id={0} size={isMobile ? 'xs' : 's'} />
          ))
        : data?.featuredRemixContests?.map((id) => (
            <RemixContestCard key={id} id={id} size='s' />
          ))}
    </>
  )
}

export const FeaturedRemixContestsSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'FeaturedRemixContestsSection'
  })

  return (
    <ExploreSection ref={ref} title={messages.featuredRemixContests}>
      <FeaturedRemixContestsContent visible={inView} />
    </ExploreSection>
  )
}
