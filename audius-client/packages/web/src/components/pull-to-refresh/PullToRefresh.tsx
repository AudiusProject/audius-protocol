import { useState, useEffect, ReactNode, memo } from 'react'

import { useInstanceVar } from '@audius/common'
import cn from 'classnames'
import Lottie, { EventListener } from 'react-lottie'
import { animated } from 'react-spring'

import iconRefreshPull from 'assets/animations/iconRefreshPull.json'
import iconRefreshSpin from 'assets/animations/iconRefreshSpin.json'
import { getIsIOS } from 'utils/browser'

import styles from './PullToRefresh.module.css'
import { useHasReachedTopPoint, useAndroidPullToRefresh } from './hooks'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

// Translate the pull arrow by a fraction of the scroll offset for parallax effect
const interpTransform = (y: number) => `translate3d(0, ${y / 8}px, 0)`
// Up the opacity to fade in the arrow
const interpOpacity = (y: number) => {
  return y >= 0 ? 0 : `${Math.min(Math.abs(y) / 40.0, 1)}`
}

type PullToRefreshProps = {
  // Call to refresh the content being wrapped
  fetchContent: () => void
  // Whether or not this should live on top of the content or inside it
  shouldPad?: boolean
  // Whether or not the refresh animation is on top of an image (white color if so)
  overImage?: boolean
  isDisabled?: boolean
  children: ReactNode | JSX.Element | null
}

/**
 * A pull-to-refresh component that wraps any component and allows it to
 * be refreshed on overflow-top pulling.
 */
const InlinePullToRefresh = memo(
  ({
    fetchContent,
    shouldPad = true,
    overImage = false,
    isDisabled = false,
    children
  }: PullToRefreshProps) => {
    // Which animation to use
    const [usePullAnimation, setUsePullAnimation] = useState(true)
    const [isDone, setIsDone] = useInstanceVar(false)
    const [hasReachedTopPoint, springProps, touchDown] = useHasReachedTopPoint({
      fetchContent,
      callback: () => {
        setIsDone(true)
      },
      cutoff: shouldPad ? -50 : -30
    })

    // Whether or not we have finished doing work and aren't still touching
    useEffect(() => {
      if (isDone() && !touchDown) {
        setUsePullAnimation(true)
        setIsDone(false)
      }
    }, [isDone, setIsDone, touchDown, hasReachedTopPoint])

    const listener = {
      eventName: 'complete',
      callback: () => {
        if (!isDone()) {
          setUsePullAnimation(false)
        }
      }
    } as EventListener

    if (isDisabled) return <>{children}</>

    return (
      <div
        className={cn(styles.wrapper, {
          [styles.addPadding]: hasReachedTopPoint && !touchDown && shouldPad
        })}
      >
        <animated.div
          className={cn(styles.pullToRefresh, {
            [styles.noPad]: !shouldPad,
            [styles.light]: overImage
          })}
          style={{
            // @ts-ignore
            transform: springProps.y.interpolate(interpTransform),
            // @ts-ignore
            opacity: springProps.y.interpolate(interpOpacity)
          }}
        >
          <div className={styles.icon}>
            {usePullAnimation ? (
              <Lottie
                options={{
                  autoplay: false,
                  loop: false,
                  animationData: iconRefreshPull
                }}
                eventListeners={[listener]}
                isPaused={!hasReachedTopPoint}
                isStopped={isDone()}
              />
            ) : (
              <Lottie
                options={{
                  autoplay: true,
                  loop: true,
                  animationData: iconRefreshSpin
                }}
              />
            )}
          </div>
        </animated.div>
        {children}
      </div>
    )
  }
)

const AndroidPullToRefresh = memo(
  ({ fetchContent, children }: PullToRefreshProps) => {
    useAndroidPullToRefresh(fetchContent)

    return <>{children}</>
  }
)

const PullToRefresh = (props: PullToRefreshProps) => {
  const Pull =
    getIsIOS() || !NATIVE_MOBILE ? InlinePullToRefresh : AndroidPullToRefresh
  return <Pull {...props} />
}

export default PullToRefresh
