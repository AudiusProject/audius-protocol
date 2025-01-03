import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import cn from 'classnames'
import Lottie, { LottieOptions, LottieRefCurrentProps } from 'lottie-react'

import styles from './Reaction.module.css'

export type ReactionProps = {
  className?: string
  animationData: Promise<{ default: LottieOptions['animationData'] }>
  isActive?: boolean
  isResponsive?: boolean
  onClick?: MouseEventHandler
  width?: number
  height?: number
  title?: string
  disableClickAnimation?: boolean
}

export const Reaction = (props: ReactionProps) => {
  const {
    className,
    animationData,
    isActive,
    isResponsive,
    onClick,
    width = 86,
    height = 86,
    title,
    disableClickAnimation = false
  } = props
  const [isInteracting, setInteracting] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [animation, setAnimation] = useState<LottieOptions['animationData']>()

  useEffect(() => {
    const loadAnimation = async () => {
      const { default: animation } = await animationData
      setAnimation(animation)
    }
    loadAnimation()
  }, [animationData])

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      if (!isClicked) {
        onClick?.(event)
      }
      setIsClicked(true)
    },
    [onClick, isClicked]
  )

  const handleMouseEnter = useCallback(() => {
    setInteracting(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setInteracting(false)
  }, [])

  useEffect(() => {
    if (isClicked) {
      const timeout = setTimeout(() => {
        setIsClicked(false)
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [isClicked])

  const lottieRef = useRef<LottieRefCurrentProps>(null)
  useEffect(() => {
    if (lottieRef.current) {
      if (isActive === false && !isInteracting) {
        lottieRef.current.stop()
      } else {
        lottieRef.current.play()
      }
    }
  }, [lottieRef, isActive, isInteracting])

  return (
    <div
      className={cn(styles.root, className, {
        [styles.active]: isActive === true,
        [styles.inactive]: isActive === false,
        [styles.responsive]: isResponsive,
        [styles.clicked]: !disableClickAnimation && isClicked
      })}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Lottie
        lottieRef={lottieRef}
        title={title}
        height={width}
        width={height}
        autoplay
        loop
        animationData={animation}
      />
    </div>
  )
}
