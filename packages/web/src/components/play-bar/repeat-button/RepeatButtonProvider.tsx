import React, { useState, useEffect, useRef } from 'react'
import RepeatButton from './RepeatButton'

type RepeatButtonProviderProps = {
  darkMode: boolean
  onRepeatOff: () => void
  onRepeatSingle: () => void
  onRepeatAll: () => void
  isMobile: boolean
}

type AnimationStates = {
  pbIconRepeatAll: string
  pbIconRepeatSingle: string
  pbIconRepeatOff: string
}

const RepeatButtonProvider = ({
  darkMode,
  onRepeatOff,
  onRepeatSingle,
  onRepeatAll,
  isMobile
}: RepeatButtonProviderProps) => {
  const [animations, setAnimations] = useState<AnimationStates | null>(null)
  const defaultAnimations = useRef<AnimationStates | null>(null)
  const darkAnimations = useRef<AnimationStates | null>(null)

  useEffect(() => {
    if (darkMode) {
      if (!darkAnimations.current) {
        const pbIconRepeatAll = require('assets/animations/pbIconRepeatAllDark.json')
        const pbIconRepeatSingle = require('assets/animations/pbIconRepeatSingleDark.json')
        const pbIconRepeatOff = require('assets/animations/pbIconRepeatOffDark.json')
        darkAnimations.current = {
          pbIconRepeatAll,
          pbIconRepeatSingle,
          pbIconRepeatOff
        }
      }
      setAnimations({ ...darkAnimations.current })
    } else {
      if (!defaultAnimations.current) {
        const pbIconRepeatAll = require('assets/animations/pbIconRepeatAll.json')
        const pbIconRepeatSingle = require('assets/animations/pbIconRepeatSingle.json')
        const pbIconRepeatOff = require('assets/animations/pbIconRepeatOff.json')
        defaultAnimations.current = {
          pbIconRepeatAll,
          pbIconRepeatSingle,
          pbIconRepeatOff
        }
      }
      setAnimations({ ...defaultAnimations.current })
    }
  }, [darkMode, setAnimations])

  return (
    animations && (
      <RepeatButton
        animations={animations}
        repeatOff={onRepeatOff}
        repeatAll={onRepeatAll}
        repeatSingle={onRepeatSingle}
        isMobile={isMobile}
      />
    )
  )
}

export default RepeatButtonProvider
