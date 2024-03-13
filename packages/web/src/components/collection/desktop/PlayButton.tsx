import { MouseEventHandler } from 'react'

import { IconPause, IconPlay, Button } from '@audius/harmony'

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
      variant='primary'
      iconLeft={isPlaying ? IconPause : IconPlay}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
    >
      {isPlaying ? messages.pause : messages.play}
    </Button>
  )
}
