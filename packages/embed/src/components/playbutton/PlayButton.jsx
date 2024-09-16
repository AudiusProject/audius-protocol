import { useEffect } from 'react'

import { Flex, IconArrowRight, IconPause, IconPlay } from '@audius/harmony'
import cn from 'classnames'

import Spinner from '../spinner/Spinner'

import styles from './PlayButton.module.css'

export const PlayingState = Object.seal({
  Playing: 'PLAYING',
  Paused: 'PAUSED',
  Buffering: 'BUFFERING',
  Stopped: 'STOPPED'
})

const PlayButton = ({
  isPlayable = true,
  playingState,
  onTogglePlay,
  url,
  iconColor,
  className,
  iconSize = 'l',
  style = {},
  iconStyle = {}
}) => {
  const stateIconMap = {
    [PlayingState.Playing]: <IconPause style={iconStyle} size='l' />,
    [PlayingState.Paused]: (
      <Flex ml='10%'>
        <IconPlay style={iconStyle} size={iconSize} />
      </Flex>
    ),
    [PlayingState.Stopped]: (
      <Flex ml='10%'>
        <IconPlay style={iconStyle} size={iconSize} />
      </Flex>
    ),
    [PlayingState.Buffering]: (
      <Spinner
        className={cn(styles.spinner, iconStyle)}
        svgStyle={{ stroke: iconColor }}
      />
    )
  }

  useEffect(() => {
    const root = document.getElementById('app')
    if (!root) {
      return
    }
    root.style.setProperty('--play-button-fill', iconColor)
    // TODO: Fix these deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      onClick={(e) => {
        if (isPlayable) {
          e.stopPropagation()
          onTogglePlay()
        } else {
          window.open(url, '_blank')
        }
      }}
      className={cn(styles.container, className)}
      style={style}
    >
      {isPlayable ? (
        stateIconMap[playingState]
      ) : (
        <IconArrowRight size={iconSize} />
      )}
    </div>
  )
}

export default PlayButton
