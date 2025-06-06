import {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  MouseEvent
} from 'react'

import { useInstanceVar } from '@audius/common/hooks'
import cn from 'classnames'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

import { SeoLink } from 'components/link'

import styles from './AnimatedButtonProvider.module.css'

type BaseAnimatedButtonProps = {
  href?: string
  onClick: ((e: MouseEvent) => void) | (() => void)
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
  href,
  isActive,
  isMatrix,
  isDisabled = false,
  className = '',
  activeClassName = '',
  disabledClassName = '',
  wrapperClassName = '',
  stopPropagation = false,
  disableAnimationOnMount = true,
  uniqueKey,
  ...buttonProps
}: AnimatedButtonProps) => {
  const [isPaused, setIsPaused] = useState(true)
  const [getDidMount, setDidMount] = useInstanceVar(false)

  useEffect(() => {
    if (isActive) {
      if (!disableAnimationOnMount || getDidMount()) {
        setIsPaused(false)
      }
    } else {
      setIsPaused(true)
    }
  }, [isActive, disableAnimationOnMount, getDidMount])

  useEffect(() => {
    setDidMount(true)
  }, [setDidMount])

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      if (stopPropagation) {
        e.stopPropagation()
      }

      if (isDisabled) return

      setImmediate(() => {
        onClick(e)
      })
    },
    [isDisabled, onClick, stopPropagation]
  )

  const animationRef = useRef<LottieRefCurrentProps>(null)
  useEffect(() => {
    if (animationRef.current) {
      if (isPaused) {
        animationRef.current.pause()
      } else {
        animationRef.current.play()
      }
    }
  }, [animationRef, isPaused])

  const buttonElement = (
    <div className={cn(wrapperClassName)}>
      <Lottie
        lottieRef={animationRef}
        animationData={iconJSON}
        loop={false}
        autoplay={false}
        onComplete={() => {
          if (!isDisabled) {
            setIsPaused(true)
          }
        }}
      />
    </div>
  )

  const rootProps = {
    onClick: handleClick,
    className: cn(styles.baseStyle, className, {
      [activeClassName]: isActive,
      [disabledClassName]: isDisabled,
      [styles.glow]: isActive && isMatrix
    })
  }

  return href ? (
    <SeoLink to={href} {...rootProps} {...buttonProps}>
      {buttonElement}
    </SeoLink>
  ) : (
    <button {...rootProps}>{buttonElement}</button>
  )
}

export type AnimatedButtonProviderProps = {
  darkMode: boolean
  isMatrix: boolean
  iconDarkJSON: () => Promise<any>
  iconLightJSON: () => Promise<any>
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
    const loadAnimations = async () => {
      if (darkMode) {
        if (!darkAnimations.current) {
          darkAnimations.current = await iconDarkJSON()
        }
        setIconJSON({ ...darkAnimations.current })
      } else {
        if (!defaultAnimations.current) {
          defaultAnimations.current = await iconLightJSON()
        }
        setIconJSON({ ...defaultAnimations.current })
      }
    }
    loadAnimations()
  }, [darkMode, setIconJSON, iconDarkJSON, iconLightJSON])

  return iconJSON && <AnimatedButton iconJSON={iconJSON} {...buttonProps} />
}

export default memo(AnimatedButtonProvider)
