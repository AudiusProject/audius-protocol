import { useMostSharedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { full } from '@audius/sdk'

import { TrackCard } from 'components/track/TrackCard'
import { useIsMobile } from 'hooks/useIsMobile'

import { Carousel } from './Carousel'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const MostSharedContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useMostSharedTracks(
    {
      pageSize: 10,
      timeRange: full.GetMostSharedTracksTimeRangeEnum.Week
    },
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

export const MostSharedSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'MostSharedSection'
  })

  return (
    <Carousel ref={ref} title={messages.mostShared}>
      <MostSharedContent visible={inView} />
    </Carousel>
  )
}
