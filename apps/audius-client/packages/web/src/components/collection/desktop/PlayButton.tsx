import { MouseEventHandler } from 'react'

import { ButtonType, IconPause, IconPlay } from '@audius/stems'

import { CollectionActionButton } from './CollectionActionButton'
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
    <CollectionActionButton
      type={ButtonType.PRIMARY_ALT}
      text={isPlaying ? messages.pause : messages.play}
      leftIcon={isPlaying ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
    />
  )
}
