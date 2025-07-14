import { useRef } from 'react'

import { useSearchAllResults } from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import { SearchKind } from '@audius/common/store'
import {
  Flex,
  Paper,
  PlainButton,
  Text,
  Avatar,
  Artwork,
  Skeleton
} from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { CollectionArtwork } from 'components/track/Artwork'
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
  album: 'Album',
  playlists: 'Playlists',
  playlist: 'Playlist',
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

  const SearchResultItem = ({
    keyValue,
    imageComponent,
    primaryText,
    secondaryText
  }: {
    keyValue: string
    imageComponent: React.ReactNode
    primaryText: string
    secondaryText: string
  }) => (
    <Flex p='xs' key={keyValue} gap='m'>
      {imageComponent}
      <Flex direction='column' flex={1}>
        <Text size='s' ellipses style={{ maxWidth: '90%' }}>
          {primaryText}
        </Text>
        <Text size='xs' color='subdued'>
          {secondaryText}
        </Text>
      </Flex>
    </Flex>
  )

  const SearchResultCard = ({
    title,
    items,
    renderItem,
    isLoading
  }: {
    title: string
    items: any[]
    renderItem: (item: any) => React.ReactNode
    isLoading?: boolean
  }) => {
    if (!isLoading && items.length === 0) return null
    return (
      <Paper border='default' shadow='mid' p='l'>
        <Flex direction='column' gap='s' style={{ minWidth: '100%' }}>
          <Text variant='label' size='s' textTransform='uppercase'>
            {title}
          </Text>
          {isLoading
            ? Array.from({ length: 5 }, (_, index) => (
                <Flex p='xs' key={index} gap='m'>
                  <Artwork isLoading={isLoading} w={40} h={40} />
                  <Flex direction='column' flex={1} gap='xs'>
                    <Skeleton h={18} w='60%' />
                    <Skeleton h={16} w='40%' />
                  </Flex>
                </Flex>
              ))
            : items.slice(0, 5).map(renderItem)}
        </Flex>
      </Paper>
    )
  }
  if (isMobile) {
    return (
      <Flex direction='column' ph='l' pb='xl' pt='s' gap='m'>
        <SearchResultCard
          title={messages.profiles}
          items={data?.users ?? []}
          isLoading={isLoading}
          renderItem={(user) => (
            <SearchResultItem
              keyValue={user.name}
              imageComponent={
                <Avatar
                  size='medium'
                  src={user.profile_picture?.['480x480']}
                  isLoading={isLoading}
                />
              }
              primaryText={user.name}
              secondaryText={messages.profile}
            />
          )}
        />
        <SearchResultCard
          title={messages.tracks}
          items={data?.tracks ?? []}
          isLoading={isLoading}
          renderItem={(track) => (
            <SearchResultItem
              keyValue={track.title}
              imageComponent={
                <TrackArtwork
                  size={SquareSizes.SIZE_150_BY_150}
                  trackId={track.track_id}
                  isLoading={isLoading}
                  h={40}
                  w={40}
                />
              }
              primaryText={track.title}
              secondaryText={messages.track}
            />
          )}
        />
        <SearchResultCard
          title={messages.playlists}
          items={data?.playlists ?? []}
          isLoading={isLoading}
          renderItem={(playlist) => (
            <SearchResultItem
              keyValue={playlist.playlist_name}
              imageComponent={
                <Artwork
                  src={playlist.artwork?.['150x150']}
                  isLoading={isLoading}
                  w={40}
                  h={40}
                />
              }
              primaryText={playlist.playlist_name}
              secondaryText={messages.playlist}
            />
          )}
        />
        <SearchResultCard
          title={messages.albums}
          items={data?.albums ?? []}
          isLoading={isLoading}
          renderItem={(album) => (
            <SearchResultItem
              keyValue={album.playlist_name}
              imageComponent={
                <Artwork
                  src={album.artwork?.['150x150']}
                  isLoading={isLoading}
                  w={40}
                  h={40}
                />
              }
              primaryText={album.playlist_name}
              secondaryText={messages.album}
            />
          )}
        />
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
