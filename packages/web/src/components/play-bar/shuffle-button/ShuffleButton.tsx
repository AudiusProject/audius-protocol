import { useState, useEffect, useCallback, useRef } from 'react'

import cn from 'classnames'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

import styles from '../PlayBarButton.module.css'

enum ShuffleStates {
  OFF = 0,
  ANIMATE_OFF_ON = 1,
  ON = 2,
  ANIMATE_ON_OFF = 3
}

const SHUFFLE_STATE_LS_KEY = 'shuffleState'
const getShuffleState = (defaultState: ShuffleStates) => {
  const localStorageShuffleState =
    window.localStorage.getItem(SHUFFLE_STATE_LS_KEY)
  if (localStorageShuffleState === null) {
    window.localStorage.setItem(SHUFFLE_STATE_LS_KEY, defaultState.toString())
    return defaultState
  } else {
    return parseInt(localStorageShuffleState)
  }
}

type ShuffleButtonProps = {
  shuffleOff: () => void
  shuffleOn: () => void
  isMobile: boolean
  animations: {
    pbIconShuffleOff: object
    pbIconShuffleOn: object
  }
}

const ShuffleButton = ({
  shuffleOff = () => {},
  shuffleOn = () => {},
  isMobile = false,
  animations
}: ShuffleButtonProps) => {
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
        [styles.shuffle]: isMobile
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

export default ShuffleButton
