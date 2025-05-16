import { useRef } from 'react'

import { useSearchAllResults } from '@audius/common/api'
import { show } from '@audius/common/src/store/music-confetti/slice'
import { SearchKind } from '@audius/common/store'
import { Flex, PlainButton, Text } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { useSearchParams } from '../hooks'

import { AlbumResults } from './AlbumResults'
import { PlaylistResults } from './PlaylistResults'
import { ProfileResultsTiles } from './ProfileResults'
import { TrackResults } from './TrackResults'

const messages = {
  profiles: 'Profiles',
  tracks: 'Tracks',
  albums: 'Albums',
  playlists: 'Playlists',
  showAll: 'Show All'
}

type AllResultsProps = {
  handleSearchTab?: (tab: string) => void
}

export const AllResults = ({ handleSearchTab }: AllResultsProps) => {
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const { query, ...filters } = useSearchParams()

  const queryData = useSearchAllResults({
    query,
    ...filters
  })

  const { data, isLoading, isPending, isError } = queryData

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
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.profiles}
            </Text>
            <PlainButton size='large' asChild>
              <Link to={`/search/profiles?query=${query}`}>
                {messages.showAll}
              </Link>
            </PlainButton>
          </Flex>
          <ProfileResultsTiles
            skeletonCount={5}
            limit={5}
            data={data?.users ?? []}
            isFetching={isLoading}
            isPending={isPending}
          />
        </Flex>
      ) : null}

      {isLoading || data?.tracks?.length ? (
        <Flex gap='xl' direction='column'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.tracks}
            </Text>
            <PlainButton size='large' asChild>
              <Link to={`/search/tracks?query=${query}`}>
                {messages.showAll}
              </Link>
            </PlainButton>
          </Flex>
          <TrackResults
            count={10}
            viewLayout='grid'
            category={SearchKind.ALL}
            isFetching={isLoading}
            isPending={isPending}
            isError={isError}
          />
        </Flex>
      ) : null}

      {isLoading || data?.albums?.length ? (
        <Flex gap='xl' direction='column'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.albums}
            </Text>
            <PlainButton size='large' asChild>
              <Link to={`/search/albums?query=${query}`}>
                {messages.showAll}
              </Link>
            </PlainButton>
          </Flex>
          <AlbumResults
            limit={5}
            data={data?.albums ?? []}
            isFetching={isLoading}
            isPending={isPending}
            skeletonCount={5}
          />
        </Flex>
      ) : null}

      {isLoading || data?.playlists?.length ? (
        <Flex gap='xl' direction='column'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.playlists}
            </Text>
            <PlainButton size='large' asChild>
              <Link to={`/search/playlists?query=${query}`}>
                {messages.showAll}
              </Link>
            </PlainButton>
          </Flex>
          <PlaylistResults
            skeletonCount={5}
            limit={5}
            data={data?.playlists ?? []}
            isFetching={isLoading}
            isPending={isPending}
          />
        </Flex>
      ) : null}
    </Flex>
  )
}
