import { useState } from 'react'

import { useFeaturedPlaylists } from '@audius/common/api'
import { UserCollection } from '@audius/common/models'
import { Flex, LoadingSpinner } from '@audius/harmony'

import { CollectionArtCard } from './CollectionArtCard'
import Section from './Section'

const messages = {
  featuredPlaylists: 'Playlists We Love Right Now',
  exploreMorePlaylists: 'Explore More Playlists'
}

const INITIAL_LIMIT = 3
const EXPANDED_LIMIT = 10

export const FeaturedPlaylists = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    data: playlists,
    isPending,
    isFetching
  } = useFeaturedPlaylists(
    { limit: isExpanded ? EXPANDED_LIMIT : INITIAL_LIMIT },
    { placeholderData: (prev: UserCollection[]) => prev }
  )

  return (
    <Section
      title={messages.featuredPlaylists}
      expandable
      expandText={messages.exploreMorePlaylists}
      onExpand={() => setIsExpanded(true)}
    >
      {playlists?.map((playlist: UserCollection) => {
        return (
          <CollectionArtCard
            key={playlist.playlist_id}
            id={playlist.playlist_id}
          />
        )
      })}
      {(isPending || isFetching) && (
        <Flex w='100%' h={320} alignItems='center' justifyContent='center'>
          <LoadingSpinner />
        </Flex>
      )}
    </Section>
  )
}
