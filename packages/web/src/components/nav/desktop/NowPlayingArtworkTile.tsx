import { CSSProperties, MouseEvent, ReactNode, useCallback } from 'react'

import { SquareSizes } from '@audius/common/models'
import {
  accountSelectors,
  averageColorSelectors,
  cacheTracksSelectors,
  playerSelectors,
  CommonState
} from '@audius/common/store'
import {
  IconWaveForm as IconVisualizer,
  IconButton,
  useTheme,
  Box
} from '@audius/harmony'
import { animated, useSpring } from '@react-spring/web'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import { Draggable } from 'components/dragndrop'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { TrackDogEar } from 'components/track/TrackDogEar'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { NO_VISUALIZER_ROUTES } from 'pages/visualizer/Visualizer'
import { openVisualizer } from 'pages/visualizer/store/slice'
import { fullTrackPage } from 'utils/route'

const { getTrackId, getCollectible } = playerSelectors
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors
const { getDominantColorsByTrack } = averageColorSelectors

const messages = {
  viewTrack: 'View currently playing track',
  showVisualizer: 'Show Visualizer'
}

type FadeInUpProps = {
  children: ReactNode
  style: CSSProperties
}

const AnimatedBox = animated(Box)

const FadeInUp = (props: FadeInUpProps) => {
  const { children, style } = props
  const { motion } = useTheme()

  const slideInProps = useSpring({
    from: { opacity: 0, height: 0 },
    to: { opacity: 1, height: 208 }
  })

  return (
    <AnimatedBox
      border='default'
      borderRadius='m'
      css={{
        boxShadow: '0 1px 20px -3px var(--currently-playing-default-shadow)',
        overflow: 'hidden',
        transition: `opacity ${motion.quick}`,
        cursor: 'pointer',
        ':hover': {
          opacity: 0.96
        }
      }}
      style={{ ...slideInProps, ...style }}
    >
      {children}
    </AnimatedBox>
  )
}

export const NowPlayingArtworkTile = () => {
  const dispatch = useDispatch()
  const { location } = useHistory()
  const { pathname } = location
  const { color, spacing } = useTheme()

  const trackId = useSelector(getTrackId)
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const isStreamGated = !!track?.is_stream_gated

  const isOwner = useSelector((state: CommonState) => {
    const ownerId = getTrack(state, { id: trackId })?.owner_id
    const accountId = getUserId(state)
    return Boolean(ownerId && accountId && ownerId === accountId)
  })

  const permalink = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.permalink
  })

  const collectibleImage = useSelector((state: CommonState) => {
    const collectible = getCollectible(state)
    if (collectible) {
      const { imageUrl, frameUrl, gifUrl } = collectible
      return imageUrl ?? frameUrl ?? gifUrl
    }
  })

  const coverArtSizes = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?._cover_art_sizes ?? null
  })

  const trackCoverArtImage = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480,
    ''
  )

  const handleShowVisualizer = useCallback(
    (event: MouseEvent) => {
      if (NO_VISUALIZER_ROUTES.has(pathname)) return
      event.preventDefault()
      dispatch(openVisualizer())
    },
    [pathname, dispatch]
  )

  const coverArtColor = useSelector((state: CommonState) => {
    const dominantTrackColors = getDominantColorsByTrack(state, {
      track: getTrack(state, { id: trackId })
    })

    const coverArtColorMap = dominantTrackColors?.[0] ?? { r: 13, g: 16, b: 18 }
    return `0 1px 20px -3px rgba(
        ${coverArtColorMap.r},
        ${coverArtColorMap.g},
        ${coverArtColorMap.b}
        , 0.25)`
  })

  if (!permalink || !trackId) return null

  const renderCoverArt = () => {
    return (
      <FadeInUp style={{ boxShadow: coverArtColor }}>
        <Link to={permalink} aria-label={messages.viewTrack}>
          <DynamicImage
            useSkeleton={false}
            image={collectibleImage ?? trackCoverArtImage}
          >
            <IconButton
              css={{
                position: 'absolute',
                bottom: spacing.unit2,
                right: spacing.unit2,
                backgroundColor: color.background.white,
                '&:hover path': {
                  fill: color.primary.primary
                }
              }}
              aria-label={messages.showVisualizer}
              onClick={handleShowVisualizer}
              icon={IconVisualizer}
              color='default'
            />
          </DynamicImage>
        </Link>
      </FadeInUp>
    )
  }

  const content = (
    <Box
      mt='unit5'
      mh='auto'
      mb={0}
      css={{ position: 'relative' }}
      h={208}
      w={208}
    >
      <TrackDogEar trackId={trackId} />
      {renderCoverArt()}
    </Box>
  )

  return isStreamGated ? (
    content
  ) : (
    <Draggable
      text={track?.title}
      kind='track'
      id={trackId}
      isOwner={isOwner}
      link={fullTrackPage(permalink)}
      asChild
    >
      {content}
    </Draggable>
  )
}
