import { useExploreContent, useTracks } from '@audius/common/api'
import { Flex } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import Section from './Section'
import { TrackArtCard } from './TrackArtCard'

const messages = {
  remixContests: 'Remix Contests'
}

export const FeaturedRemixContests = () => {
  const { data: exploreContent, isLoading } = useExploreContent()
  const contestIds = exploreContent?.featuredRemixContests ?? []
  const { isLoading: isTracksLoading } = useTracks(contestIds)

  return (
    <Section title={messages.remixContests} css={{ minHeight: 380 }}>
      {isLoading || isTracksLoading ? (
        <Flex
          justifyContent='center'
          alignItems='center'
          css={{ minHeight: 300 }}
        >
          <LoadingSpinner css={{ width: 48 }} />
        </Flex>
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
