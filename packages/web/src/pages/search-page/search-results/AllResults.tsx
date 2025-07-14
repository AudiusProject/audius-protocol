import { useRef } from 'react'

import { useSearchAllResults } from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import tracks from '@audius/common/src/store/pages/track/lineup/reducer'
import { SearchKind } from '@audius/common/store'
import {
  Flex,
  Paper,
  PlainButton,
  Text,
  Avatar,
  Artwork
} from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { TrackArtwork } from 'components/track/TrackArtwork'
import { Size } from 'components/track-flair/types'
import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { useSearchParams } from '../hooks'

import { AlbumResults } from './AlbumResults'
import { PlaylistResults } from './PlaylistResults'
import { ProfileResultsTiles } from './ProfileResults'
import { TrackResults } from './TrackResults'

const messages = {
  profiles: 'Profiles',
  profile: 'Profile',
  tracks: 'Tracks',
  track: 'Track',
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

  if (isMobile) {
    return (
      <Flex direction='column' ph='l' pb='xl' pt='s' gap='m'>
        <Paper border='default' shadow='mid' p='l'>
          {data?.users?.length ? (
            <Flex direction='column' style={{ minWidth: '100%' }}>
              <Text size='s' ellipses style={{ maxWidth: '70%' }}>
                {messages.profiles}
              </Text>
              {data.users.slice(0, 5).map((user) => (
                <Flex p='xs' key={user.name} gap='m'>
                  <Avatar
                    size='medium'
                    src={user.profile_picture?.['480x480']}
                  />
                  <Flex direction='column'>
                    <Text size='s'> {user.name}</Text>
                    <Text size='xs' color='subdued'>
                      {messages.profile}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          ) : null}
        </Paper>
        <Paper border='default' shadow='mid' p='l'>
          {data?.tracks?.length ? (
            <Flex direction='column' gap='s'>
              <Text variant='label' size='s' textTransform='uppercase'>
                {messages.tracks}
              </Text>
              {data.tracks.slice(0, 5).map((track) => (
                <Flex p='xs' key={track.title} gap='m'>
                  <TrackArtwork
                    size={SquareSizes.SIZE_150_BY_150}
                    trackId={track.track_id}
                    h={40}
                    w={40}
                  />
                  <Flex direction='column' style={{ minWidth: '100%' }}>
                    <Text size='s' ellipses style={{ maxWidth: '70%' }}>
                      {track.title}
                    </Text>
                    <Text size='xs' color='subdued'>
                      {messages.track}
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          ) : null}
        </Paper>
      </Flex>
    )
  }

  return (
    <Flex direction='column' gap='unit10' ref={containerRef}>
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
