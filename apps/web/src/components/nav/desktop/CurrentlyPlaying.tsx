import { memo, useRef, MouseEvent } from 'react'

import { Color, CoverArtSizes, SquareSizes, Nullable } from '@audius/common'
import cn from 'classnames'

import { ReactComponent as IconVisualizer } from 'assets/img/iconVisualizer.svg'
import Draggable from 'components/dragndrop/Draggable'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

import styles from './CurrentlyPlaying.module.css'

type CurrentlyPlayingProps = {
  isOwner: boolean
  isUnlisted: boolean
  trackId: Nullable<number>
  trackTitle: Nullable<string>
  coverArtSizes: Nullable<CoverArtSizes>
  coverArtColor: Nullable<Color>
  artworkLink?: Nullable<string>
  draggableLink: Nullable<string>
  onClick: () => void
  onShowVisualizer: (e: MouseEvent) => void
}

type ArtworkStyle = {
  backgroundImage?: string
  backgroundColor?: string
}

type WrapperStyle = {
  boxShadow: string
}

const CurrentlyPlaying = ({
  isOwner,
  isUnlisted,
  trackId,
  trackTitle,
  coverArtSizes,
  coverArtColor,
  artworkLink,
  draggableLink,
  onClick,
  onShowVisualizer
}: CurrentlyPlayingProps) => {
  const previousTrackId = useRef(0)

  const image = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480,
    ''
  )

  let newTrack = false
  if (trackId && trackId !== previousTrackId.current) {
    newTrack = true
    previousTrackId.current = trackId
  }

  let wrapperStyle: WrapperStyle
  let artworkStyle: ArtworkStyle
  if (trackId) {
    const artworkAverageColor = coverArtColor ?? { r: 13, g: 16, b: 18 }
    wrapperStyle = {
      boxShadow: `0 1px 20px -3px rgba(
        ${artworkAverageColor.r},
        ${artworkAverageColor.g},
        ${artworkAverageColor.b}
        , 0.7)`
    }
    artworkStyle = {}
  } else {
    wrapperStyle = {
      boxShadow: '0 1px 15px -2px var(--currently-playing-default-shadow)'
    }
    artworkStyle = {
      backgroundColor: 'var(--neutral-light-8)'
    }
  }

  return (
    <Draggable
      isDisabled={!trackId || isUnlisted}
      text={trackTitle}
      kind='track'
      id={trackId}
      isOwner={isOwner}
      link={draggableLink}
    >
      <div
        className={cn(styles.artworkWrapper, {
          [styles.playing]: !!trackId
        })}
        style={wrapperStyle}
        onClick={onClick}
      >
        <DynamicImage
          useSkeleton={false}
          image={artworkLink ?? image}
          immediate={newTrack}
          className={styles.artwork}
          imageStyle={artworkStyle}
        >
          <div
            className={cn(styles.bottomRightContainer, {
              [styles.hide]: !trackId
            })}
          >
            <div
              onClick={(e) => onShowVisualizer(e)}
              className={styles.visualizerIconContainer}
            >
              <IconVisualizer className={styles.visualizerIcon} />
            </div>
          </div>
        </DynamicImage>
      </div>
    </Draggable>
  )
}

export default memo(CurrentlyPlaying)
