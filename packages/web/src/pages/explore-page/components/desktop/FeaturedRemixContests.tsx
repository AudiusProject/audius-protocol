import { useExploreContent } from '@audius/common/api'

import Section from './Section'
import { TrackArtCard } from './TrackArtCard'

const messages = {
  remixContests: 'Remix Contests'
}

export const FeaturedRemixContests = () => {
  const { data: exploreContent } = useExploreContent()
  const contestIds = exploreContent?.featuredRemixContests ?? []

  return (
    <Section title={messages.remixContests}>
      {contestIds.slice(0, 4).map((id) => (
        <TrackArtCard key={id} id={id} />
      ))}
    </Section>
  )
}
