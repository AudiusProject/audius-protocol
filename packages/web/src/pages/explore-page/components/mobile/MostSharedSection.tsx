import { useMostSharedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackCard } from 'components/track/TrackCard'

import { ExploreSection } from '../desktop/ExploreSection'

export const MostSharedSection = () => {
  const { data: mostSharedTracks, isLoading } = useMostSharedTracks()

  if (!isLoading && (!mostSharedTracks || mostSharedTracks.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      title={messages.mostShared}
      data={mostSharedTracks}
      isLoading={isLoading}
      Card={TrackCard}
    />
  )
}
