import { FeatureFlags } from '@audius/common'
import { Button, ButtonType, IconPause, IconPlay } from '@audius/stems'

import { useFlag } from 'hooks/useRemoteConfig'

import styles from './GiantTrackTile.module.css'

type PlayPauseButtonProps = {
  doesUserHaveAccess: boolean
  playing: boolean
  onPlay: () => void
}

export const PlayPauseButton = ({
  doesUserHaveAccess,
  playing,
  onPlay
}: PlayPauseButtonProps) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  return (
    <Button
      name='play'
      className={styles.playButton}
      textClassName={styles.playButtonText}
      type={ButtonType.PRIMARY_ALT}
      text={playing ? 'PAUSE' : 'PLAY'}
      leftIcon={playing ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
      disabled={isPremiumContentEnabled ? !doesUserHaveAccess : false}
    />
  )
}
