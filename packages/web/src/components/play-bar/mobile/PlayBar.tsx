import { useEffect, useState } from 'react'

import {
  queueActions,
  tracksSocialActions,
  playerSelectors,
  queueSelectors
} from '@audius/common'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  Name,
  FavoriteSource,
  PlaybackSource,
  SquareSizes,
  ID
} from '@audius/common/models'
import { IconLock } from '@audius/stems'
import cn from 'classnames'
import { connect, useSelector } from 'react-redux'
import { Dispatch } from 'redux'

import { make, useRecord } from 'common/store/analytics/actions'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import CoSign, { Size } from 'components/co-sign/CoSign'
import PlayButton from 'components/play-bar/PlayButton'
import TrackingBar from 'components/play-bar/TrackingBar'
import { PlayButtonStatus } from 'components/play-bar/types'
import { LockedStatusBadge } from 'components/track/LockedStatusBadge'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { audioPlayer } from 'services/audio-player'
import { AppState } from 'store/types'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import styles from './PlayBar.module.css'
const { makeGetCurrent } = queueSelectors
const { getPreviewing, getBuffering, getCounter, getPlaying } = playerSelectors
const { recordListen, saveTrack, unsaveTrack } = tracksSocialActions
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
  save,
  unsave,
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
    (useTrackCoverArt(
      track ? track.track_id : null,
      track ? track._cover_art_sizes : null,
      SquareSizes.SIZE_150_BY_150
    ) ||
      collectible?.imageUrl) ??
    collectible?.frameUrl ??
    collectible?.gifUrl

  const { hasStreamAccess } = useGatedContentAccess(track)
  const isPreviewing = useSelector(getPreviewing)
  const shouldShowPreviewLock =
    track?.stream_conditions &&
    'usdc_purchase' in track.stream_conditions &&
    (!hasStreamAccess || isPreviewing)

  if (((!uid || !track) && !collectible) || !user) return null

  const getDisplayInfo = () => {
    if (track && !collectible) {
      return track
    }
    return {
      title: collectible?.name,
      track_id: collectible?.id,
      has_current_user_saved: false,
      _co_sign: null
    }
  }

  const { title, track_id, has_current_user_saved, _co_sign } = getDisplayInfo()

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

  const toggleFavorite = () => {
    if (track && track_id && typeof track_id === 'number') {
      has_current_user_saved ? unsave(track_id) : save(track_id)
    }
  }

  return (
    <>
      <div className={styles.playBar}>
        <TrackingBar percentComplete={percentComplete} />
        <div className={styles.controls}>
          {shouldShowPreviewLock ? null : (
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
              <CoSign
                className={styles.artwork}
                size={Size.TINY}
                hasFavorited={_co_sign.has_remix_author_saved}
                hasReposted={_co_sign.has_remix_author_reposted}
                coSignName={_co_sign.user.name}
                userId={_co_sign.user.user_id}
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
              </CoSign>
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
                  iconSize='small'
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
    save: (trackId: ID) => dispatch(saveTrack(trackId, FavoriteSource.PLAYBAR)),
    unsave: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.PLAYBAR)),
    recordListen: (trackId: ID) => dispatch(recordListen(trackId))
  }
}

export default connect(makeMapStateToProps, mapDispatchToProps)(PlayBar)
