import { useState, useEffect, useCallback } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import styles from '../PlayBarButton.module.css'

const ShuffleStates = Object.freeze({
  OFF: 0,
  ANIMATE_OFF_ON: 1,
  ON: 2,
  ANIMATE_ON_OFF: 3
})

const SHUFFLE_STATE_LS_KEY = 'shuffleState'
const getShuffleState = (defaultState) => {
  const localStorageShuffleState =
    window.localStorage.getItem(SHUFFLE_STATE_LS_KEY)
  if (localStorageShuffleState === null) {
    window.localStorage.setItem(SHUFFLE_STATE_LS_KEY, defaultState)
    return defaultState
  } else {
    return parseInt(localStorageShuffleState)
  }
}

const ShuffleButton = ({
  shuffleOff = () => {},
  shuffleOn = () => {},
  isMobile = false,
  animations
}) => {
  const [state, setState] = useState({
    shuffleState: getShuffleState(ShuffleStates.OFF),
    isPaused: true,
    icon: animations ? animations.pbIconShuffleOn : null
  })

  const handleChange = useCallback(
    (shuffleState) => {
      const { pbIconShuffleOff, pbIconShuffleOn } = animations
      // Go to the next state.
      let icon, isPaused
      switch (shuffleState) {
        case ShuffleStates.OFF:
          shuffleOff()
          icon = pbIconShuffleOn
          isPaused = true
          break
        case ShuffleStates.ANIMATE_OFF_ON:
          icon = pbIconShuffleOn
          isPaused = false
          break
        case ShuffleStates.ON:
          shuffleOn()
          icon = pbIconShuffleOff
          isPaused = true
          break
        case ShuffleStates.ANIMATE_ON_OFF:
          icon = pbIconShuffleOff
          isPaused = false
          break
        default:
          icon = pbIconShuffleOn
          isPaused = true
      }
      window.localStorage.setItem(SHUFFLE_STATE_LS_KEY, shuffleState)
      setState({
        icon,
        isPaused,
        shuffleState
      })
    },
    [animations, shuffleOff, shuffleOn]
  )

  useEffect(() => {
    handleChange(state.shuffleState)
  }, [handleChange, state.shuffleState])

  useEffect(() => {
    handleChange(state.shuffleState)
  }, [animations, handleChange, state.shuffleState])

  const nextState = () => {
    const shuffleState =
      (state.shuffleState + 1) % Object.keys(ShuffleStates).length
    handleChange(shuffleState)
  }

  const eventListeners = [
    {
      eventName: 'complete',
      callback: () => nextState()
    }
  ]
  const animationOptions = {
    loop: false,
    autoplay: false,
    animationData: state.icon
  }

  return (
    <button
      className={cn(styles.button, {
        [styles.buttonFixedSize]: isMobile,
        [styles.shuffle]: isMobile
      })}
      onClick={nextState}
    >
      <Lottie
        options={animationOptions}
        eventListeners={eventListeners}
        isPaused={state.isPaused}
      />
    </button>
  )
}

ShuffleButton.propTypes = {
  shuffleOff: PropTypes.func,
  shuffleOn: PropTypes.func,
  isMobile: PropTypes.bool,
  animations: PropTypes.object
}

export default ShuffleButton
