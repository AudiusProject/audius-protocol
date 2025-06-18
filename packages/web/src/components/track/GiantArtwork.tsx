import { memo, useEffect } from 'react'

import { SquareSizes, Remix } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { IconArrowLeft, Box, Flex, useTheme, spacing } from '@audius/harmony'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import TrackFlair from 'components/track-flair/TrackFlair'
import { Size } from 'components/track-flair/types'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

type GiantArtworkProps = {
  trackId: number
  coSign: Nullable<Remix>
  callback: () => void
  onIconLeftClick?: () => void
}

const messages = {
  artworkAltText: 'Track Artwork'
}

const GiantArtwork = (props: GiantArtworkProps) => {
  const { trackId, callback, onIconLeftClick } = props
  const image = useTrackCoverArt({
    trackId,
    size: SquareSizes.SIZE_1000_BY_1000
  })
  useEffect(() => {
    if (image) callback()
  }, [image, callback])

  const { color } = useTheme()
  const imageElement = (
    <Box
      borderRadius='m'
      border='default'
      w={338}
      h={338}
      css={{
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <DynamicImage image={image} alt={messages.artworkAltText}>
        {onIconLeftClick && (
          <Flex
            onClick={onIconLeftClick}
            css={{
              position: 'absolute',
              top: spacing.l,
              left: spacing.l,
              width: spacing.unit10,
              height: spacing.unit10,
              borderRadius: spacing.unit5,
              background: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                background: 'rgba(0, 0, 0, 0.7)'
              },
              '& svg path': {
                fill: color.static.white
              }
            }}
          >
            <IconArrowLeft width={spacing.xl} height={spacing.xl} />
          </Flex>
        )}
      </DynamicImage>
    </Box>
  )

  return (
    <Box
      w={338}
      h={338}
      css={{
        minHeight: '338px',
        minWidth: '338px',
        userSelect: 'none'
      }}
    >
      <TrackFlair size={Size.XLARGE} id={trackId}>
        {imageElement}
      </TrackFlair>
    </Box>
  )
}

export default memo(GiantArtwork)
