import React, { memo, useState, useEffect, useRef, useCallback } from 'react'

import cn from 'classnames'
import Lottie from 'react-lottie'

import useInstanceVar from 'common/hooks/useInstanceVar'

import styles from './AnimatedButtonProvider.module.css'

export type BaseAnimatedButtonProps = {
  onClick: ((e: React.MouseEvent) => void) | (() => void)
  uniqueKey: string
  isActive: boolean
  isDisabled?: boolean
  className?: string
  disabledClassName?: string
  activeClassName?: string
  wrapperClassName?: string
  stopPropagation?: boolean
  isMatrix: boolean

  // If we mount in the active state,
  // should we animate that transition or not?
  disableAnimationOnMount?: boolean
}

type IconJSON = any

type AnimatedButtonProps = {
  iconJSON: IconJSON
} & BaseAnimatedButtonProps

const AnimatedButton = ({
  iconJSON,
  onClick,
  isActive,
  isMatrix,
  uniqueKey,
  isDisabled = false,
  className = '',
  activeClassName = '',
  disabledClassName = '',
  wrapperClassName = '',
  stopPropagation = false,
  disableAnimationOnMount = true
}: AnimatedButtonProps) => {
  const [isPaused, setIsPaused] = useState(true)
  // The key suffix is used to reset the animation (i.e. time = 0)
  const [keySuffix, setKeySuffix] = useState(0)

  const [getDidMount, setDidMount] = useInstanceVar(false)

  useEffect(() => {
    if (isActive) {
      if (!disableAnimationOnMount || getDidMount()) {
        setIsPaused(false)
      }
    } else {
      setKeySuffix(keySuffix => keySuffix + 1)
      setIsPaused(true)
    }
  }, [isActive, disableAnimationOnMount, getDidMount])

  useEffect(() => {
    setDidMount(true)
  }, [setDidMount])

  const animationOptions = {
    loop: false,
    autoplay: false,
    animationData: iconJSON
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (stopPropagation) {
        e.stopPropagation()
      }

      if (isDisabled) return

      e.persist()
      setImmediate(() => {
        onClick(e)
      })
    },
    [isDisabled, onClick, stopPropagation]
  )

  const eventListeners = [
    {
      eventName: 'complete' as const,
      callback: () => {
        setIsPaused(true)
      }
    }
  ]

  return (
    <button
      onClick={handleClick}
      className={cn(
        [styles.baseStyle],
        className,
        {
          [activeClassName]: isActive
        },
        {
          [disabledClassName]: isDisabled
        },
        { [styles.glow]: isActive && isMatrix }
      )}
    >
      <div className={cn(wrapperClassName)}>
        <Lottie
          // We construct a unique here with a suffix that changes each time
          // isActive is changed to false. This allows the parent of this component
          // to reset the state of other animated buttons.
          key={`${uniqueKey}-${keySuffix}`}
          options={animationOptions}
          isPaused={isPaused}
          isClickToPauseDisabled
          eventListeners={isDisabled ? [] : eventListeners}
        />
      </div>
    </button>
  )
}

export type AnimatedButtonProviderProps = {
  darkMode: boolean
  isMatrix: boolean
  iconDarkJSON: () => any
  iconLightJSON: () => any
} & BaseAnimatedButtonProps

const AnimatedButtonProvider = ({
  darkMode,
  iconDarkJSON,
  iconLightJSON,
  ...buttonProps
}: AnimatedButtonProviderProps) => {
  const [iconJSON, setIconJSON] = useState<IconJSON | null>(null)
  const defaultAnimations = useRef<IconJSON | null>(null)
  const darkAnimations = useRef<IconJSON | null>(null)

  useEffect(() => {
    if (darkMode) {
      if (!darkAnimations.current) {
        darkAnimations.current = iconDarkJSON()
      }
      setIconJSON({ ...darkAnimations.current })
    } else {
      if (!defaultAnimations.current) {
        defaultAnimations.current = iconLightJSON()
      }
      setIconJSON({ ...defaultAnimations.current })
    }
  }, [darkMode, setIconJSON, iconDarkJSON, iconLightJSON])

  return iconJSON && <AnimatedButton iconJSON={iconJSON} {...buttonProps} />
}

export default memo(AnimatedButtonProvider)
