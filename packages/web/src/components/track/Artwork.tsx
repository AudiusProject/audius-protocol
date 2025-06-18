import { memo } from 'react'

import { SquareSizes, ID } from '@audius/common/models'
import {
  IconLock,
  IconPlaybackPlay as IconPlay,
  IconPlaybackPause as IconPause,
  Box,
  Flex,
  useTheme,
  spacing
} from '@audius/harmony'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import TrackFlair from 'components/track-flair/TrackFlair'
import { Size } from 'components/track-flair/types'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

type TileArtworkProps = {
  id: ID
  size: any
  isBuffering: boolean
  isPlaying: boolean
  showArtworkIcon: boolean
  showSkeleton: boolean
  hasStreamAccess?: boolean
}

export const ArtworkIcon = ({
  isBuffering,
  isPlaying,
  hasStreamAccess,
  isTrack
}: {
  isBuffering: boolean
  isPlaying: boolean
  hasStreamAccess?: boolean
  isTrack?: boolean
}) => {
  const { color } = useTheme()

  let artworkIcon
  if (isTrack && !hasStreamAccess) {
    artworkIcon = <IconLock width={spacing.unit9} height={spacing.unit9} />
  } else if (isBuffering) {
    artworkIcon = (
      <Box
        w={spacing.unit9}
        h={spacing.unit9}
        css={{
          pointerEvents: 'none',
          '& g path': {
            stroke: color.static.white
          }
        }}
      >
        <LoadingSpinner />
      </Box>
    )
  } else if (isPlaying) {
    artworkIcon = <IconPause />
  } else {
    artworkIcon = <IconPlay />
  }
  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      css={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        opacity: 0,
        transition: 'all ease-in-out 0.18s',
        '& > svg, & > div': {
          width: '40%',
          height: '40%',
          transition: 'all ease-in-out 0.18s'
        },
        '& path': {
          fill: color.static.white
        },
        '& circle': {
          opacity: 0
        },
        '& g circle[fill="#FFFFFF"]': {
          fill: 'rgba(0, 0, 0, 0)'
        }
      }}
    >
      {artworkIcon}
    </Flex>
  )
}

type ArtworkProps = TileArtworkProps & {
  image: any
  label?: string
  isTrack?: boolean
}

const Artwork = memo(
  ({
    id,
    size,
    showSkeleton,
    showArtworkIcon,
    isBuffering,
    isPlaying,
    image,
    label,
    hasStreamAccess,
    isTrack
  }: ArtworkProps) => {
    const imageElement = (
      <DynamicImage
        image={showSkeleton ? '' : image}
        aria-label={label}
        css={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: spacing.xs,
          border: '1px solid var(--harmony-n-100)',
          height: '100%',
          '&:hover [data-artwork-icon]': showArtworkIcon && {
            opacity: 1
          },
          ...(size === 'small' && {
            marginBottom: spacing.unitHalf,
            '& [data-artwork-icon] > svg, & [data-artwork-icon] > div': {
              width: '65%',
              height: '65%'
            }
          })
        }}
      >
        {showArtworkIcon && (
          <Box data-artwork-icon>
            <ArtworkIcon
              isBuffering={isBuffering}
              isPlaying={isPlaying}
              hasStreamAccess={hasStreamAccess}
              isTrack={isTrack}
            />
          </Box>
        )}
      </DynamicImage>
    )
    return isTrack ? (
      <Box h='100%'>
        <TrackFlair size={Size.MEDIUM} id={id}>
          {imageElement}
        </TrackFlair>
      </Box>
    ) : (
      imageElement
    )
  }
)

export const TrackArtwork = memo((props: TileArtworkProps) => {
  const image = useTrackCoverArt({
    trackId: props.id,
    size: SquareSizes.SIZE_150_BY_150
  })

  return <Artwork {...props} image={image} isTrack />
})

export const CollectionArtwork = memo((props: TileArtworkProps) => {
  const image = useCollectionCoverArt({
    collectionId: props.id,
    size: SquareSizes.SIZE_150_BY_150
  })

  return <Artwork {...props} image={image} />
})
