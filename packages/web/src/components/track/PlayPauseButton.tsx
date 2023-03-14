import { FeatureFlags, PlaybackStatus } from '@audius/common'
import { Button, ButtonType, IconPause, IconPlay } from '@audius/stems'

import { ReactComponent as IconRepeat } from 'assets/img/iconRepeatOff.svg'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './GiantTrackTile.module.css'

type PlayPauseButtonProps = {
  doesUserHaveAccess: boolean
  playing: boolean
  playbackStatus?: PlaybackStatus | null
  onPlay: () => void
}

const messages = {
  play: 'PLAY',
  pause: 'PAUSE',
  resume: 'RESUME',
  replay: 'REPLAY'
}

export const PlayPauseButton = ({
  doesUserHaveAccess,
  playing,
  playbackStatus,
  onPlay
}: PlayPauseButtonProps) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )
  const { isEnabled: isNewPodcastControlsEnabled } = useFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED
  )

  const playText =
    isNewPodcastControlsEnabled && playbackStatus
      ? playbackStatus === 'IN_PROGRESS'
        ? messages.resume
        : messages.replay
      : messages.play

  const playIcon =
    isNewPodcastControlsEnabled &&
    playbackStatus &&
    playbackStatus === 'COMPLETED' ? (
      <IconRepeat />
    ) : (
      <IconPlay />
    )

  return (
    <Button
      name='play'
      className={styles.playButton}
      textClassName={styles.playButtonText}
      type={ButtonType.PRIMARY_ALT}
      text={playing ? 'PAUSE' : playText}
      leftIcon={playing ? <IconPause /> : playIcon}
      onClick={onPlay}
      disabled={isGatedContentEnabled ? !doesUserHaveAccess : false}
    />
  )
}
