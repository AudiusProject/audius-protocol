import { useMostSharedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackCard } from 'components/track/TrackCard'

import { ExploreSection } from '../desktop/ExploreSection'

export const MostSharedSection = () => {
  const { data: mostSharedTracks } = useMostSharedTracks()
  return (
    <ExploreSection
      title={messages.mostShared}
      data={mostSharedTracks}
      Card={TrackCard}
    />
  )
}
