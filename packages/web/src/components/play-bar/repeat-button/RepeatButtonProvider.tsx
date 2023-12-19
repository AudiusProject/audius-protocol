import { useState, useEffect, useRef } from 'react'

import RepeatButton from './RepeatButton'

type RepeatButtonProviderProps = {
  darkMode: boolean
  isMatrix: boolean
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
  isMatrix,
  onRepeatOff,
  onRepeatSingle,
  onRepeatAll,
  isMobile
}: RepeatButtonProviderProps) => {
  const [animations, setAnimations] = useState<AnimationStates | null>(null)
  const defaultAnimations = useRef<AnimationStates | null>(null)
  const darkAnimations = useRef<AnimationStates | null>(null)
  const matrixAnimations = useRef<AnimationStates | null>(null)

  useEffect(() => {
    const loadAnimations = async () => {
      if (isMatrix) {
        if (!matrixAnimations.current) {
          const pbIconRepeatAll = require('assets/animations/pbIconRepeatAllMatrix.json')
          const pbIconRepeatSingle = require('assets/animations/pbIconRepeatSingleMatrix.json')
          const pbIconRepeatOff = require('assets/animations/pbIconRepeatOffMatrix.json')
          matrixAnimations.current = {
            pbIconRepeatAll,
            pbIconRepeatSingle,
            pbIconRepeatOff
          }
        }

        setAnimations({ ...matrixAnimations.current })
      } else if (darkMode) {
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
          const { default: pbIconRepeatAll } = (await import(
            '../../../assets/animations/pbIconRepeatAll.json'
          )) as any
          const { default: pbIconRepeatSingle } = (await import(
            '../../../assets/animations/pbIconRepeatSingle.json'
          )) as any
          const { default: pbIconRepeatOff } = (await import(
            '../../../assets/animations/pbIconRepeatOff.json'
          )) as any
          defaultAnimations.current = {
            pbIconRepeatAll,
            pbIconRepeatSingle,
            pbIconRepeatOff
          }
        }
        setAnimations({ ...defaultAnimations.current })
      }
    }
    loadAnimations()
  }, [darkMode, setAnimations, isMatrix])

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
