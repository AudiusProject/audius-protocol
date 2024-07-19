import { useRef } from 'react'

import { Status } from '@audius/common/models'
import { SearchKind } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { useGetSearchResults } from '../utils'

import { AlbumResults } from './AlbumResults'
import { PlaylistResults } from './PlaylistResults'
import { ProfileResults } from './ProfileResults'
import { TrackResults } from './TrackResults'

const messages = {
  profiles: 'Profiles',
  tracks: 'Tracks',
  albums: 'Albums',
  playlists: 'Playlists'
}

export const AllResults = () => {
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, status } = useGetSearchResults('all')
  const isLoading = status === Status.LOADING

  const isResultsEmpty =
    data &&
    data.albums?.length === 0 &&
    data.users?.length === 0 &&
    data.playlists?.length === 0 &&
    data.tracks?.length === 0

  const showNoResultsTile = !isLoading && isResultsEmpty

  if (showNoResultsTile) return <NoResultsTile />

  return (
    <Flex
      direction='column'
      gap='unit10'
      p={isMobile ? 'm' : undefined}
      ref={containerRef}
    >
      {isLoading || data.users?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.profiles}
          </Text>
          <ProfileResults skeletonCount={5} ids={data.users} limit={5} />
        </Flex>
      ) : null}

      {isLoading || data.tracks?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.tracks}
          </Text>
          <TrackResults
            count={12}
            viewLayout='grid'
            category={SearchKind.ALL}
          />
        </Flex>
      ) : null}

      {isLoading || data.albums?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.albums}
          </Text>
          <AlbumResults skeletonCount={5} ids={data.albums} limit={5} />
        </Flex>
      ) : null}

      {isLoading || data.playlists?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.playlists}
          </Text>
          <PlaylistResults skeletonCount={5} ids={data.playlists} limit={5} />
        </Flex>
      ) : null}
    </Flex>
  )
}
