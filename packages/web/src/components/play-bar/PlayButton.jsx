import { useState, useEffect, useRef } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import pbIconPause from 'assets/animations/pbIconPause.json'
import pbIconPlay from 'assets/animations/pbIconPlay.json'
import pbLoadingSpinner from 'assets/animations/pbLoadingSpinner.json'

import styles from './PlayBarButton.module.css'

const PlayStates = Object.freeze({
  PAUSE: 0,
  ANIMATE_PAUSE_PLAY: 1,
  PLAY: 2,
  ANIMATE_PLAY_PAUSE: 3
})

const PlayButton = ({
  playable = true,
  status = 'play',
  onClick = () => {}
}) => {
  const [playState, setPlayState] = useState(PlayStates.PLAY)
  const [isPaused, setIsPaused] = useState(true)
  const [icon, setIcon] = useState(pbIconPlay)
  const prevStatus = useRef(status)

  useEffect(() => {
    if (status === 'pause') {
      setIcon(pbIconPause)
      setPlayState(PlayStates.PAUSE)
    }
  }, [status])

  useEffect(() => {
    let newIcon, newIsPaused, newPlayState

    if (status === 'play' && playState !== PlayStates.PLAY) {
      if (prevStatus.current === 'load') {
        newIcon = pbIconPlay
        newIsPaused = true
        newPlayState = PlayStates.PLAY
      } else {
        newIcon = pbIconPause
        newIsPaused = false
        newPlayState = PlayStates.ANIMATE_PAUSE_PLAY
      }
    }
    if (status === 'pause' && playState !== PlayStates.PAUSE) {
      if (prevStatus.current === 'load') {
        newIcon = pbIconPause
        newIsPaused = true
        newPlayState = PlayStates.PAUSE
      } else {
        newIcon = pbIconPlay
        newIsPaused = false
        newPlayState = PlayStates.ANIMATE_PLAY_PAUSE
      }
    }

    if (newIcon) setIcon(newIcon)
    if (newIsPaused !== undefined) setIsPaused(newIsPaused)
    if (newPlayState !== undefined) setPlayState(newPlayState)
    prevStatus.current = status
  }, [status, playState])

  const handleChange = () => {
    let newIcon, newIsPaused
    const newPlayState = (playState + 1) % Object.keys(PlayStates).length

    switch (newPlayState) {
      case PlayStates.PLAY:
        newIcon = pbIconPlay
        newIsPaused = true
        break
      case PlayStates.ANIMATE_PLAY_PAUSE:
        newIcon = pbIconPlay
        newIsPaused = false
        break
      case PlayStates.PAUSE:
        newIcon = pbIconPause
        newIsPaused = true
        break
      case PlayStates.ANIMATE_PAUSE_PLAY:
        newIcon = pbIconPause
        newIsPaused = false
        break
      default:
        newIcon = pbIconPlay
        newIsPaused = true
    }

    setIcon(newIcon)
    setIsPaused(newIsPaused)
    setPlayState(newPlayState)
  }

  const handleClick = () => {
    if (playable) {
      handleChange()
      onClick()
    }
  }

  const isLoading = status === 'load'
  const eventListeners = [
    {
      eventName: 'complete',
      callback: () => handleChange()
    }
  ]

  let data, currentIsPaused
  let loop = false
  if (isLoading) {
    data = pbLoadingSpinner
    currentIsPaused = false
    loop = true
  } else {
    data = icon
    currentIsPaused = isPaused
  }

  const animationOptions = {
    loop,
    autoplay: false,
    animationData: data
  }

  const ariaLabel = isLoading
    ? 'track loading'
    : playState === PlayStates.PLAY
      ? 'play track'
      : 'pause track'

  return (
    <button
      aria-label={ariaLabel}
      className={cn(styles.button, styles.playButton)}
      onClick={handleClick}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      <div className={styles.animation}>
        <Lottie
          ariaRole={null}
          ariaLabel={null}
          options={animationOptions}
          eventListeners={eventListeners}
          isPaused={currentIsPaused}
        />
      </div>
    </button>
  )
}

PlayButton.propTypes = {
  playable: PropTypes.bool,
  status: PropTypes.oneOf(['play', 'pause', 'load']),
  onClick: PropTypes.func
}

export default PlayButton
