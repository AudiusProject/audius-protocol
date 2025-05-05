import { useExploreContent } from '@audius/common/api'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import Section from './Section'
import { TrackArtCard } from './TrackArtCard'

const messages = {
  remixContests: 'Remix Contests'
}

export const FeaturedRemixContests = () => {
  const { data: exploreContent, isLoading } = useExploreContent()
  const contestIds = exploreContent?.featuredRemixContests ?? []

  return (
    <Section title={messages.remixContests}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {contestIds.slice(0, 4).map((id) => (
            <TrackArtCard key={id} id={id} />
          ))}
        </>
      )}
    </Section>
  )
}
