import { useRecentlyPlayedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackCard } from 'components/track/TrackCard'
import { useIsMobile } from 'hooks/useIsMobile'

import { ExploreSection } from './ExploreSection'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const RecentlyPlayedContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useRecentlyPlayedTracks(
    { pageSize: 10 },
    { enabled: visible }
  )
  const isMobile = useIsMobile()

  return (
    <>
      {!visible || !data || isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            // loading skeletons
            <TrackCard key={i} id={0} size={isMobile ? 'xs' : 's'} />
          ))
        : data?.map((id) => <TrackCard key={id} id={id} size='s' />)}
    </>
  )
}

export const RecentlyPlayedSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'RecentlyPlayedSection'
  })

  return (
    <ExploreSection
      ref={ref}
      title={messages.recentlyPlayed}
      viewAllLink='/history'
    >
      <RecentlyPlayedContent visible={inView} />
    </ExploreSection>
  )
}
