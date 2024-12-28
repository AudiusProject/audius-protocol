import { CSSProperties, MouseEvent, ReactNode, useCallback } from 'react'

import { SquareSizes } from '@audius/common/models'
import {
  accountSelectors,
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
import { Link, useLocation } from 'react-router-dom'

import { Draggable } from 'components/dragndrop'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { TrackDogEar } from 'components/track/TrackDogEar'
import {
  useTrackCoverArt,
  useTrackCoverArtDominantColor
} from 'hooks/useTrackCoverArt'
import { NO_VISUALIZER_ROUTES } from 'pages/visualizer/Visualizer'
import { openVisualizer } from 'pages/visualizer/store/slice'
import { fullTrackPage } from 'utils/route'

const { getTrackId, getCollectible } = playerSelectors
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors

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
  const { pathname } = useLocation()
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

  const trackCoverArtImage = useTrackCoverArt({
    trackId: trackId ?? undefined,
    size: SquareSizes.SIZE_480_BY_480
  })

  const handleShowVisualizer = useCallback(
    (event: MouseEvent) => {
      if (NO_VISUALIZER_ROUTES.has(pathname)) return
      event.preventDefault()
      dispatch(openVisualizer())
    },
    [pathname, dispatch]
  )

  const coverArtColor = useTrackCoverArtDominantColor({
    trackId: trackId ?? undefined
  })

  if (!permalink || !trackId) return null

  const renderCoverArt = () => {
    return (
      <FadeInUp
        style={{
          boxShadow: `0px 3px 4px 0px rgba(
            ${coverArtColor?.r},
            ${coverArtColor?.g},
            ${coverArtColor?.b},
            ${coverArtColor ? 0.25 : 0})`,
          transition: 'box-shadow 0.3s ease-in-out'
        }}
      >
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
