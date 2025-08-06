import { useTrendingPlaylists, UseLineupQueryData } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ID, PlaybackSource, Status, UID } from '@audius/common/models'
import { Flex } from '@audius/harmony'
import { ClassNames } from '@emotion/react'

import { CollectionTile as DesktopCollectionTile } from 'components/track/desktop/CollectionTile'
import { CollectionTile as MobileCollectionTile } from 'components/track/mobile/CollectionTile'
import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

import { Carousel } from './Carousel'
import {
  COLLECTION_TILE_HEIGHT,
  MOBILE_COLLECTION_TILE_HEIGHT,
  MOBILE_TILE_WIDTH,
  TILE_WIDTH
} from './constants'

type TileType = typeof DesktopCollectionTile | typeof MobileCollectionTile

const CollectionTileSkeleton = ({
  size,
  Tile
}: {
  size: TrackTileSize
  Tile: TileType
}) => {
  return (
    <ClassNames>
      {({ css }) => (
        <Flex
          w={size === TrackTileSize.LARGE ? TILE_WIDTH : MOBILE_TILE_WIDTH}
          h={
            size === TrackTileSize.LARGE
              ? COLLECTION_TILE_HEIGHT
              : MOBILE_COLLECTION_TILE_HEIGHT
          }
        >
          <Tile
            hasLoaded={() => {}}
            isTrending={false}
            isFeed={false}
            id={0}
            containerClassName={css({ width: '100%', height: '100%' })}
            numLoadingSkeletonRows={5}
            size={size}
            isLoading={true}
            uid={''}
            ordered={false}
            index={0}
            togglePlay={() => {}}
            playTrack={() => {}}
            pauseTrack={() => {}}
          />
        </Flex>
      )}
    </ClassNames>
  )
}

const CollectionLineupCarousel = ({
  lineup,
  play,
  pause,
  togglePlay,
  size,
  Tile
}: {
  lineup: UseLineupQueryData['lineup']
  play: (uid: UID, id: ID, source: PlaybackSource) => void
  pause: (uid: UID, id: ID, source: PlaybackSource) => void
  togglePlay: (uid: UID, id: ID, source: PlaybackSource) => void
  size: TrackTileSize
  Tile: TileType
}) => {
  return (
    <>
      {lineup.entries.map((item, index) => {
        return (
          <Flex
            key={item.id}
            w={size === TrackTileSize.LARGE ? TILE_WIDTH : MOBILE_TILE_WIDTH}
            h={
              size === TrackTileSize.LARGE
                ? COLLECTION_TILE_HEIGHT
                : MOBILE_COLLECTION_TILE_HEIGHT
            }
          >
            <ClassNames>
              {({ css }) => (
                <Tile
                  ordered={true}
                  size={size}
                  togglePlay={() =>
                    togglePlay(
                      item.uid,
                      item.id,
                      PlaybackSource.PLAYLIST_TILE_TRACK
                    )
                  }
                  playTrack={() =>
                    play(item.uid, item.id, PlaybackSource.PLAYLIST_TILE_TRACK)
                  }
                  pauseTrack={() =>
                    pause(item.uid, item.id, PlaybackSource.PLAYLIST_TILE_TRACK)
                  }
                  id={item.id}
                  index={index}
                  isTrending={true}
                  uid={item.uid}
                  isLoading={false}
                  containerClassName={css({ width: '100%', height: '100%' })}
                  hasLoaded={() => {}}
                  isFeed={false}
                />
              )}
            </ClassNames>
          </Flex>
        )
      })}
    </>
  )
}

export const TrendingPlaylistsSection = () => {
  const isMobile = useIsMobile()
  const size = isMobile ? TrackTileSize.SMALL : TrackTileSize.LARGE
  const {
    lineup,
    isLoading: hookIsLoading,
    play,
    pause,
    togglePlay
  } = useTrendingPlaylists()
  const isLoading = hookIsLoading || lineup.status === Status.LOADING
  const Tile = isMobile ? MobileCollectionTile : DesktopCollectionTile

  if (!isLoading && lineup.entries.length === 0) {
    return null
  }

  return (
    <Carousel
      title={messages.trendingPlaylists}
      viewAllLink='/explore/playlists'
    >
      {isLoading ? (
        <>
          <CollectionTileSkeleton size={size} Tile={Tile} />
          <CollectionTileSkeleton size={size} Tile={Tile} />
        </>
      ) : (
        <CollectionLineupCarousel
          lineup={lineup}
          play={play}
          pause={pause}
          togglePlay={togglePlay}
          size={size}
          Tile={Tile}
        />
      )}
    </Carousel>
  )
}
