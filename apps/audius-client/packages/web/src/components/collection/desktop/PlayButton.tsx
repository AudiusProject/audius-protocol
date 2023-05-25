import { MouseEventHandler } from 'react'

import { Button, ButtonType, IconPause, IconPlay } from '@audius/stems'
import cn from 'classnames'

import styles from './CollectionHeader.module.css'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

const messages = {
  play: 'Play',
  pause: 'Pause'
}

type PlayButtonProps = {
  onPlay: MouseEventHandler
  playing: boolean
}

export const PlayButton = (props: PlayButtonProps) => {
  const { onPlay, playing: isPlaying } = props

  return (
    <Button
      className={cn(styles.playAllButton, {
        [styles.buttonFormatting]: isPlaying
      })}
      textClassName={styles.buttonTextFormatting}
      type={ButtonType.PRIMARY_ALT}
      text={isPlaying ? messages.pause : messages.play}
      leftIcon={isPlaying ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      minWidth={132}
    />
  )
}
