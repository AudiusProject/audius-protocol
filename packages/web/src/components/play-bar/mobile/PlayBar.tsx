import { useEffect, useState } from 'react'

import { useToggleFavoriteTrack } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  Name,
  FavoriteSource,
  PlaybackSource,
  SquareSizes,
  ID
} from '@audius/common/models'
import {
  queueActions,
  queueSelectors,
  tracksSocialActions,
  playerSelectors
} from '@audius/common/store'
import { IconLock } from '@audius/harmony'
import cn from 'classnames'
import { connect, useSelector } from 'react-redux'
import { Dispatch } from 'redux'

import { make, useRecord } from 'common/store/analytics/actions'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import TrackFlair, { Size } from 'components/co-sign/TrackFlair'
import { LockedStatusBadge } from 'components/locked-status-badge'
import PlayButton from 'components/play-bar/PlayButton'
import TrackingBar from 'components/play-bar/TrackingBar'
import { PlayButtonStatus } from 'components/play-bar/types'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { audioPlayer } from 'services/audio-player'
import { AppState } from 'store/types'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import styles from './PlayBar.module.css'
const { makeGetCurrent } = queueSelectors
const { getPreviewing, getBuffering, getCounter, getPlaying } = playerSelectors
const { recordListen } = tracksSocialActions
const { pause, play } = queueActions

const SEEK_INTERVAL = 200

const messages = {
  preview: 'preview'
}

type OwnProps = {
  onClickInfo: () => void
}

type PlayBarProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps>

const PlayBar = ({
  currentQueueItem,
  isPlaying,
  isBuffering,
  play,
  pause,
  onClickInfo
}: PlayBarProps) => {
  const { uid, track, user, collectible } = currentQueueItem

  const [percentComplete, setPercentComplete] = useState(0)
  const record = useRecord()

  useEffect(() => {
    const seekInterval = setInterval(async () => {
      if (!audioPlayer) {
        return
      }
      const duration = await audioPlayer.getDuration()
      const pos = await audioPlayer.getPosition()
      if (duration === undefined || pos === undefined) return

      const position = Math.min(pos, duration)
      const percent = (position / duration) * 100
      if (percent) setPercentComplete(percent)
    }, SEEK_INTERVAL)
    return () => clearInterval(seekInterval)
  })

  const image =
    (useTrackCoverArt({
      trackId: track ? track.track_id : undefined,
      size: SquareSizes.SIZE_150_BY_150,
      defaultImage: ''
    }) ||
      collectible?.imageUrl) ??
    collectible?.frameUrl ??
    collectible?.gifUrl

  const { hasStreamAccess } = useGatedContentAccess(track)
  const isPreviewing = useSelector(getPreviewing)
  const shouldShowPreviewLock =
    isPreviewing ||
    (track?.stream_conditions &&
      'usdc_purchase' in track.stream_conditions &&
      !hasStreamAccess)

  const toggleFavorite = useToggleFavoriteTrack({
    trackId: track?.track_id,
    source: FavoriteSource.PLAYBAR
  })

  if (((!uid || !track) && !collectible) || !user) return null

  const getDisplayInfo = () => {
    if (track && !collectible) {
      return track
    }
    return {
      title: collectible?.name,
      track_id: collectible?.id,
      has_current_user_saved: false,
      _co_sign: null,
      is_unlisted: false
    }
  }

  const {
    title,
    track_id,
    has_current_user_saved,
    _co_sign,
    is_unlisted: isUnlisted
  } = getDisplayInfo()

  const { name } = user

  let playButtonStatus
  if (isBuffering) {
    playButtonStatus = PlayButtonStatus.LOAD
  } else if (isPlaying) {
    playButtonStatus = PlayButtonStatus.PAUSE
  } else {
    playButtonStatus = PlayButtonStatus.PLAY
  }

  const togglePlay = () => {
    if (isPlaying) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${track_id}`,
          source: PlaybackSource.PLAYBAR
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${track_id}`,
          source: PlaybackSource.PLAYBAR
        })
      )
    }
  }

  return (
    <>
      <div className={styles.playBar}>
        <TrackingBar percentComplete={percentComplete} />
        <div className={styles.controls}>
          {shouldShowPreviewLock || isUnlisted ? null : (
            <FavoriteButton
              isDisabled={track?.is_unlisted}
              onClick={toggleFavorite}
              isDarkMode={isDarkMode()}
              isMatrixMode={isMatrix()}
              isActive={has_current_user_saved}
              className={styles.favorite}
            />
          )}
          <div className={styles.info} onClick={onClickInfo}>
            {_co_sign ? (
              <TrackFlair
                className={styles.artwork}
                size={Size.TINY}
                id={track_id}
              >
                <div
                  className={styles.image}
                  style={{
                    backgroundImage: `url(${image})`
                  }}
                >
                  {shouldShowPreviewLock ? (
                    <div className={styles.lockOverlay}>
                      <IconLock className={styles.iconLock} />
                    </div>
                  ) : null}
                </div>
              </TrackFlair>
            ) : (
              <div
                className={cn(styles.artwork, styles.image)}
                style={{
                  backgroundImage: `url(${image})`
                }}
              >
                {shouldShowPreviewLock ? (
                  <div className={styles.lockOverlay}>
                    <IconLock className={styles.iconLock} />
                  </div>
                ) : null}
              </div>
            )}
            <div className={styles.title}>{title}</div>
            <div className={styles.separator}>•</div>
            <div className={styles.artist}>{name}</div>
            {shouldShowPreviewLock ? (
              <div className={styles.lockPreview}>
                <LockedStatusBadge
                  locked
                  variant='premium'
                  text={messages.preview}
                  coloredWhenLocked
                  iconSize='2xs'
                />
              </div>
            ) : null}
          </div>
          <div className={styles.play}>
            <PlayButton
              playable
              status={playButtonStatus}
              onClick={togglePlay}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function makeMapStateToProps() {
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => ({
    currentQueueItem: getCurrentQueueItem(state),
    playCounter: getCounter(state),
    isPlaying: getPlaying(state),
    isBuffering: getBuffering(state)
  })
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    play: () => {
      dispatch(play({}))
    },
    pause: () => {
      dispatch(pause({}))
    },
    recordListen: (trackId: ID) => dispatch(recordListen(trackId))
  }
}

export default connect(makeMapStateToProps, mapDispatchToProps)(PlayBar)
