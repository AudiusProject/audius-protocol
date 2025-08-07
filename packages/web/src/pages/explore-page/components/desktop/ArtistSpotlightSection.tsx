import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { UserCard } from 'components/user-card'
import { useIsMobile } from 'hooks/useIsMobile'

import { ExploreSection } from './ExploreSection'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const ArtistSpotlightContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useExploreContent({ enabled: visible })
  const isMobile = useIsMobile()

  return (
    <>
      {!visible || !data?.featuredProfiles || isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            // loading skeletons
            <UserCard key={i} id={0} size={isMobile ? 'xs' : 's'} />
          ))
        : data?.featuredProfiles?.map((id) => (
            <UserCard key={id} id={id} size='s' />
          ))}
    </>
  )
}

export const ArtistSpotlightSection = ({
  hide = false
}: {
  hide?: boolean
}) => {
  const { ref, inView } = useDeferredElement({
    name: 'ArtistSpotlightSection'
  })

  return (
    <ExploreSection ref={ref} title={messages.artistSpotlight}>
      <ArtistSpotlightContent visible={inView} />
    </ExploreSection>
  )
}
