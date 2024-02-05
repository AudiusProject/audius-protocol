import { MouseEventHandler } from 'react'

import { IconPause, IconPlay } from '@audius/harmony'
import { ButtonType } from '@audius/stems'

import { EntityActionButton } from '../../entity-page/EntityActionButton'

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
    <EntityActionButton
      type={ButtonType.PRIMARY_ALT}
      text={isPlaying ? messages.pause : messages.play}
      leftIcon={isPlaying ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
    />
  )
}
