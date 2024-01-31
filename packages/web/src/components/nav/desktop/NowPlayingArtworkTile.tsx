import { CSSProperties, MouseEvent, ReactNode, useCallback } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import { DogEarType, SquareSizes } from '@audius/common/models'
import {
  accountSelectors,
  averageColorSelectors,
  cacheTracksSelectors,
  playerSelectors,
  CommonState
} from '@audius/common/store'
import { IconButton } from '@audius/stems'
import { animated, useSpring } from '@react-spring/web'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import IconVisualizer from 'assets/img/iconVisualizer.svg'
import { DogEar } from 'components/dog-ear'
import { Draggable } from 'components/dragndrop'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { NO_VISUALIZER_ROUTES } from 'pages/visualizer/Visualizer'
import { openVisualizer } from 'pages/visualizer/store/slice'
import { fullTrackPage } from 'utils/route'

import styles from './NowPlayingArtworkTile.module.css'

const { getTrackId, getCollectible, getPreviewing } = playerSelectors
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

const FadeInUp = (props: FadeInUpProps) => {
  const { children, style } = props

  const slideInProps = useSpring({
    from: { opacity: 0, height: 0 },
    to: { opacity: 1, height: 208 }
  })

  return (
    <animated.div
      className={styles.fadeIn}
      style={{ ...slideInProps, ...style }}
    >
      {children}
    </animated.div>
  )
}

export const NowPlayingArtworkTile = () => {
  const dispatch = useDispatch()
  const { location } = useHistory()
  const { pathname } = location

  const trackId = useSelector(getTrackId)
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const isStreamGated = !!track?.is_stream_gated
  const { hasStreamAccess } = useGatedContentAccess(track)
  const isPreviewing = useSelector(getPreviewing)
  const shouldShowPurchaseDogEar =
    track?.stream_conditions &&
    'usdc_purchase' in track.stream_conditions &&
    (!hasStreamAccess || isPreviewing)

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

  const renderDogEar = () => {
    return shouldShowPurchaseDogEar ? (
      <div className={styles.borderOffset}>
        <DogEar type={DogEarType.USDC_PURCHASE} className={styles.dogEar} />
      </div>
    ) : null
  }

  const renderCoverArt = () => {
    return (
      <FadeInUp style={{ boxShadow: coverArtColor }}>
        <Link to={permalink} aria-label={messages.viewTrack}>
          <DynamicImage
            useSkeleton={false}
            image={collectibleImage ?? trackCoverArtImage}
          >
            <IconButton
              className={styles.visualizerIconButton}
              aria-label={messages.showVisualizer}
              onClick={handleShowVisualizer}
              icon={<IconVisualizer className={styles.visualizerIcon} />}
            />
          </DynamicImage>
        </Link>
      </FadeInUp>
    )
  }

  if (isStreamGated) {
    return (
      <div className={styles.root}>
        {renderDogEar()}
        {renderCoverArt()}
      </div>
    )
  }

  return (
    <Draggable
      text={track?.title}
      kind='track'
      id={trackId}
      isOwner={isOwner}
      link={fullTrackPage(permalink)}
      className={styles.root}
    >
      {renderDogEar()}
      {renderCoverArt()}
    </Draggable>
  )
}
