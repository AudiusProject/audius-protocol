import { useState, useEffect, useCallback, useRef } from 'react'

import cn from 'classnames'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

import styles from '../PlayBarButton.module.css'

enum RepeatStates {
  OFF = 0,
  ANIMATE_OFF_ALL = 1,
  ALL = 2,
  ANIMATE_ALL_SINGLE = 3,
  SINGLE = 4,
  ANIMATE_SINGLE_OFF = 5
}

const REPEAT_STATE_LS_KEY = 'repeatState'
const getRepeatState = (defaultState: RepeatStates) => {
  const localStorageRepeatState =
    window.localStorage.getItem(REPEAT_STATE_LS_KEY)
  if (localStorageRepeatState === null) {
    window.localStorage.setItem(REPEAT_STATE_LS_KEY, defaultState.toString())
    return defaultState
  } else {
    return parseInt(localStorageRepeatState)
  }
}

type RepeatButtonProps = {
  animations: {
    pbIconRepeatAll: object
    pbIconRepeatSingle: object
    pbIconRepeatOff: object
  }
  repeatOff: () => void
  repeatSingle: () => void
  repeatAll: () => void
  isMobile: boolean
}

const RepeatButton = ({
  animations,
  repeatOff = () => {},
  repeatSingle = () => {},
  repeatAll = () => {},
  isMobile = false
}: RepeatButtonProps) => {
  const [state, setState] = useState({
    repeatState: getRepeatState(RepeatStates.OFF),
    isPaused: true,
    icon: animations ? animations.pbIconRepeatAll : null
  })

  const handleChange = useCallback(
    (repeatState: RepeatStates) => {
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
      window.localStorage.setItem(REPEAT_STATE_LS_KEY, repeatState.toString())
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

  const lottieRef = useRef<LottieRefCurrentProps>(null)
  useEffect(() => {
    if (lottieRef.current) {
      if (state.isPaused) {
        lottieRef.current.pause()
      } else {
        lottieRef.current.play()
      }
    }
  }, [lottieRef, state.isPaused])

  return (
    <button
      className={cn(styles.button, {
        [styles.buttonFixedSize]: isMobile,
        [styles.repeat]: isMobile
      })}
      onClick={nextState}
    >
      <Lottie
        lottieRef={lottieRef}
        loop={false}
        autoplay={false}
        animationData={state.icon}
        onComplete={nextState}
      />
    </button>
  )
}

export default RepeatButton
