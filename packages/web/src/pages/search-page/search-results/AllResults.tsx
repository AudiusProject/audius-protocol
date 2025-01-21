import { useRef } from 'react'

import { SearchKind } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { useGetSearchResults } from '../hooks'

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

  const { data, isLoading } = useGetSearchResults('all')

  const isResultsEmpty =
    data &&
    data.albums?.length === 0 &&
    data.users?.length === 0 &&
    data.playlists?.length === 0 &&
    data.tracks?.length === 0

  const showNoResultsTile = !isLoading && isResultsEmpty

  if (showNoResultsTile) return <NoResultsTile />

  const {
    users: userIds,
    tracks: trackIds,
    playlists: playlistIds,
    albums: albumIds
  } = data ?? {}

  return (
    <Flex
      direction='column'
      gap='unit10'
      p={isMobile ? 'm' : undefined}
      ref={containerRef}
    >
      {isLoading || userIds?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.profiles}
          </Text>
          <ProfileResults skeletonCount={5} ids={userIds} limit={5} />
        </Flex>
      ) : null}

      {isLoading || trackIds?.length ? (
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

      {isLoading || albumIds?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.albums}
          </Text>
          <AlbumResults skeletonCount={5} ids={albumIds} limit={5} />
        </Flex>
      ) : null}

      {isLoading || playlistIds?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.playlists}
          </Text>
          <PlaylistResults skeletonCount={5} ids={playlistIds} limit={5} />
        </Flex>
      ) : null}
    </Flex>
  )
}
