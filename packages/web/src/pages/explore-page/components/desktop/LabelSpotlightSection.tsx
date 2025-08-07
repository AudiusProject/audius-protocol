import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { UserCard } from 'components/user-card'
import { useIsMobile } from 'hooks/useIsMobile'

import { ExploreSection } from './ExploreSection'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const LabelSpotlightContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useExploreContent({ enabled: visible })
  const isMobile = useIsMobile()

  return (
    <>
      {!visible || !data?.featuredLabels || isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            // loading skeletons
            <UserCard key={i} id={0} size={isMobile ? 'xs' : 's'} />
          ))
        : data?.featuredLabels?.map((id) => (
            <UserCard key={id} id={id} size='s' />
          ))}
    </>
  )
}

export const LabelSpotlightSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'LabelSpotlightSection'
  })

  return (
    <ExploreSection ref={ref} title={messages.labelSpotlight}>
      <LabelSpotlightContent visible={inView} />
    </ExploreSection>
  )
}
