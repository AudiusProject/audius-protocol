import { useTrendingPlaylists, UseLineupQueryData } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ID, PlaybackSource, Status, UID } from '@audius/common/models'
import { Flex } from '@audius/harmony'
import { ClassNames } from '@emotion/react'

import { CollectionTile } from 'components/track/desktop/CollectionTile'
import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

import { Carousel } from './Carousel'
import {
  COLLECTION_TILE_HEIGHT,
  MOBILE_COLLECTION_TILE_HEIGHT,
  MOBILE_TILE_WIDTH,
  TILE_WIDTH
} from './constants'

const CollectionTileSkeleton = ({ size }: { size: TrackTileSize }) => {
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
          <CollectionTile
            hasLoaded={() => {}}
            isTrending={false}
            isFeed={false}
            id={0}
            containerClassName={css({ width: '100%' })}
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
  size
}: {
  lineup: UseLineupQueryData['lineup']
  play: (uid: UID, id: ID, source: PlaybackSource) => void
  pause: (uid: UID, id: ID, source: PlaybackSource) => void
  togglePlay: (uid: UID, id: ID, source: PlaybackSource) => void
  size: TrackTileSize
}) => {
  return (
    <>
      {lineup.entries.map((item, index) => (
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
              <CollectionTile
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
                {...item}
                id={item.id}
                index={index}
                isTrending={true}
                uid={item.uid}
                isLoading={false}
                containerClassName={css({ width: '100%' })}
                hasLoaded={() => {}}
                isFeed={false}
              />
            )}
          </ClassNames>
        </Flex>
      ))}
    </>
  )
}

export const TrendingPlaylists = () => {
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

  if (!isLoading && lineup.entries.length === 0) {
    return null
  }

  return (
    <Carousel title={messages.trendingPlaylists}>
      {isLoading ? (
        <>
          <CollectionTileSkeleton size={size} />
          <CollectionTileSkeleton size={size} />
        </>
      ) : (
        <CollectionLineupCarousel
          lineup={lineup}
          play={play}
          pause={pause}
          togglePlay={togglePlay}
          size={size}
        />
      )}
    </Carousel>
  )
}
