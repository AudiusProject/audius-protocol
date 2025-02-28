import { useEffect, useState } from 'react'

import { useToggleSaveTrack } from '@audius/common/api'
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
import CoSign, { Size } from 'components/co-sign/CoSign'
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
  onClickInfo,
  recordListen
}: PlayBarProps) => {
  const { uid, track, user, collectible } = currentQueueItem

  const track_id = track?.track_id
  const title = track?.title ?? ''
  const is_verified = user?.is_verified
  const has_current_user_saved = track?.has_current_user_saved
  const preview_user_id = track?.preview_user_id
  const streamConditions = track?.stream_conditions
  const handle = user?.handle
  const name = user?.name ?? ''
  const _co_sign = track && '_co_sign' in track ? track._co_sign : null

  const { isFetchingNFTAccess, hasStreamAccess } = useGatedContentAccess(
    currentQueueItem.track
  )

  const [timeElapsed, setTimeElapsed] = useState(0)
  const record = useRecord()
  const image = useTrackCoverArt(
    track_id,
    collectible,
    SquareSizes.SIZE_150_BY_150,
    ''
  )

  const toggleSaveTrack = useToggleSaveTrack({
    trackId: track_id as number,
    source: FavoriteSource.PLAYBAR
  })

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
      if (percent) setTimeElapsed(percent)
    }, SEEK_INTERVAL)
    return () => clearInterval(seekInterval)
  }, [])

  const isPreviewing = useSelector(getPreviewing)
  const shouldShowPreviewLock =
    isPreviewing ||
    (streamConditions &&
      'usdc_purchase' in streamConditions &&
      !hasStreamAccess)

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
    title: displayTitle,
    track_id: displayTrackId,
    has_current_user_saved: displayHasCurrentUserSaved,
    _co_sign: displayCoSign,
    is_unlisted: isUnlisted
  } = getDisplayInfo()

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
      toggleSaveTrack()
    }
  }

  return (
    <>
      <div className={styles.playBar}>
        <TrackingBar percentComplete={timeElapsed} />
        <div className={styles.controls}>
          {shouldShowPreviewLock || isUnlisted ? null : (
            <FavoriteButton
              isDisabled={track?.is_unlisted}
              onClick={toggleFavorite}
              isDarkMode={isDarkMode()}
              isMatrixMode={isMatrix()}
              isActive={displayHasCurrentUserSaved}
              className={styles.favorite}
            />
          )}
          <div className={styles.info} onClick={onClickInfo}>
            {displayCoSign ? (
              <CoSign
                className={styles.artwork}
                size={Size.TINY}
                hasFavorited={displayCoSign.has_remix_author_saved}
                hasReposted={displayCoSign.has_remix_author_reposted}
                coSignName={displayCoSign.user.name}
                userId={displayCoSign.user.user_id}
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
            <div className={styles.title}>{displayTitle}</div>
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
