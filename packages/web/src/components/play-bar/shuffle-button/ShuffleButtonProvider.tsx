import React, { useState, useEffect, useRef } from 'react'
import ShuffleButton from './ShuffleButton'

type ShuffleButtonProviderProps = {
  darkMode: boolean
  onShuffleOn: () => void
  onShuffleOff: () => void
  isMobile: boolean
}

type AnimationStates = {
  pbIconShuffleOff: string
  pbIconShuffleOn: string
}

const ShuffleButtonProvider = ({
  darkMode,
  onShuffleOn,
  onShuffleOff,
  isMobile
}: ShuffleButtonProviderProps) => {
  const [animations, setAnimations] = useState<AnimationStates | null>(null)
  const defaultAnimations = useRef<AnimationStates | null>(null)
  const darkAnimations = useRef<AnimationStates | null>(null)

  useEffect(() => {
    if (darkMode) {
      if (!darkAnimations.current) {
        const pbIconShuffleOff = require('assets/animations/pbIconShuffleOffDark.json')
        const pbIconShuffleOn = require('assets/animations/pbIconShuffleOnDark.json')
        darkAnimations.current = {
          pbIconShuffleOff,
          pbIconShuffleOn
        }
      }
      setAnimations({ ...darkAnimations.current })
    } else {
      if (!defaultAnimations.current) {
        const pbIconShuffleOff = require('assets/animations/pbIconShuffleOff.json')
        const pbIconShuffleOn = require('assets/animations/pbIconShuffleOn.json')
        defaultAnimations.current = {
          pbIconShuffleOff,
          pbIconShuffleOn
        }
      }
      setAnimations({ ...defaultAnimations.current })
    }
  }, [darkMode, setAnimations])

  return (
    animations && (
      <ShuffleButton
        animations={animations}
        shuffleOn={onShuffleOn}
        shuffleOff={onShuffleOff}
        isMobile={isMobile}
      />
    )
  )
}

export default ShuffleButtonProvider
