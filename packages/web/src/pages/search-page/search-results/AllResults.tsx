import { useRef } from 'react'

import { useSearchAllResults } from '@audius/common/api'
import { SearchKind } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { useSearchParams } from '../hooks'

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
  const { query, ...filters } = useSearchParams()

  const queryData = useSearchAllResults({
    query,
    ...filters
  })

  const { data, isLoading } = queryData

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
      {isLoading || data?.users?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.profiles}
          </Text>
          <ProfileResults
            skeletonCount={5}
            limit={5}
            queryData={{ ...queryData, data: data?.users ?? [] }}
          />
        </Flex>
      ) : null}

      {isLoading || data?.tracks?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.tracks}
          </Text>
          <TrackResults
            count={12}
            viewLayout='grid'
            category={SearchKind.ALL}
            queryData={queryData}
          />
        </Flex>
      ) : null}

      {isLoading || data?.albums?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.albums}
          </Text>
          <AlbumResults
            skeletonCount={5}
            limit={5}
            queryData={{ ...queryData, data: data?.albums ?? [] }}
          />
        </Flex>
      ) : null}

      {isLoading || data?.playlists?.length ? (
        <Flex gap='xl' direction='column'>
          <Text variant='heading' textAlign='left'>
            {messages.playlists}
          </Text>
          <PlaylistResults
            skeletonCount={5}
            limit={5}
            queryData={{ ...queryData, data: data?.playlists ?? [] }}
          />
        </Flex>
      ) : null}
    </Flex>
  )
}
