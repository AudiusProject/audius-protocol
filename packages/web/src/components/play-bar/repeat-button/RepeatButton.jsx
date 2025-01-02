import { useState, useEffect, useCallback } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import styles from '../PlayBarButton.module.css'

const RepeatStates = Object.freeze({
  OFF: 0,
  ANIMATE_OFF_ALL: 1,
  ALL: 2,
  ANIMATE_ALL_SINGLE: 3,
  SINGLE: 4,
  ANIMATE_SINGLE_OFF: 5
})

const REPEAT_STATE_LS_KEY = 'repeatState'
const getRepeatState = (defaultState) => {
  const localStorageRepeatState =
    window.localStorage.getItem(REPEAT_STATE_LS_KEY)
  if (localStorageRepeatState === null) {
    window.localStorage.setItem(REPEAT_STATE_LS_KEY, defaultState)
    return defaultState
  } else {
    return parseInt(localStorageRepeatState)
  }
}

const RepeatButton = ({
  animations,
  repeatOff = () => {},
  repeatSingle = () => {},
  repeatAll = () => {},
  isMobile = false
}) => {
  const [state, setState] = useState({
    repeatState: getRepeatState(RepeatStates.OFF),
    isPaused: true,
    icon: animations ? animations.pbIconRepeatAll : null
  })

  const handleChange = useCallback(
    (repeatState) => {
      const { pbIconRepeatAll, pbIconRepeatSingle, pbIconRepeatOff } =
        animations
      // Go to the next state.
      let icon, isPaused
      switch (repeatState) {
        case RepeatStates.OFF:
          repeatOff()
          icon = pbIconRepeatAll
          isPaused = true
          break
        case RepeatStates.ANIMATE_OFF_ALL:
          icon = pbIconRepeatAll
          isPaused = false
          break
        case RepeatStates.ALL:
          repeatAll()
          icon = pbIconRepeatSingle
          isPaused = true
          break
        case RepeatStates.ANIMATE_ALL_SINGLE:
          icon = pbIconRepeatSingle
          isPaused = false
          break
        case RepeatStates.SINGLE:
          repeatSingle()
          icon = pbIconRepeatOff
          isPaused = true
          break
        case RepeatStates.ANIMATE_SINGLE_OFF:
          icon = pbIconRepeatOff
          isPaused = false
          break
        default:
          icon = pbIconRepeatAll
          isPaused = true
      }
      window.localStorage.setItem(REPEAT_STATE_LS_KEY, repeatState)
      setState({
        icon,
        isPaused,
        repeatState
      })
    },
    [animations, repeatOff, repeatAll, repeatSingle]
  )

  useEffect(() => {
    handleChange(state.repeatState)
  }, [handleChange, state.repeatState])

  useEffect(() => {
    handleChange(state.repeatState)
  }, [animations, handleChange, state.repeatState])

  const nextState = () => {
    const repeatState =
      (state.repeatState + 1) % Object.keys(RepeatStates).length
    handleChange(repeatState)
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
        [styles.repeat]: isMobile
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

RepeatButton.propTypes = {
  animations: PropTypes.object,
  repeatOff: PropTypes.func,
  repeatSingle: PropTypes.func,
  repeatAll: PropTypes.func,
  isMobile: PropTypes.bool
}

export default RepeatButton
