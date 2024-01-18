import { useCallback, useEffect, useRef, useState } from 'react'

import LottieView from 'lottie-react-native'
import type {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView
} from 'react-native'
import { Animated } from 'react-native'
import { usePrevious } from 'react-use'

import IconRefreshPull from 'app/assets/animations/iconRefreshPull.json'
import IconRefreshSpin from 'app/assets/animations/iconRefreshSpin.json'
import * as haptics from 'app/haptics'
import { makeAnimations, makeStyles } from 'app/styles'
import { attachToScroll } from 'app/utils/animation'
import { colorize } from 'app/utils/colorizeLottie'

const PULL_DISTANCE = 75
const DEBOUNCE_TIME_MS = 0

const useAnimations = makeAnimations(({ palette }) => {
  const { neutralLight4, staticWhite } = palette
  const iconRefreshSpin = colorize(IconRefreshSpin, {
    'assets.0.layers.0.shapes.0.it.1.ck': neutralLight4
  })

  const iconRefreshPull = colorize(IconRefreshPull, {
    // arrow Outlines 4.Group 1.Stroke 1
    'assets.0.layers.0.shapes.0.it.1.c.k': neutralLight4,
    // arrow Outlines 2.Group 3.Stroke 1
    'layers.1.shapes.0.it.1.c.k': neutralLight4,
    // arrow Outlines.Group 1.Stroke 1
    'layers.2.shapes.0.it.1.c.k': neutralLight4,
    // arrow Outlines.Group 2.Stroke 1
    'layers.2.shapes.1.it.1.c.k': neutralLight4
  })

  const iconRefreshSpinWhite = colorize(IconRefreshSpin, {
    'assets.0.layers.0.shapes.0.it.1.ck': staticWhite
  })

  const iconRefreshPullWhite = colorize(IconRefreshPull, {
    // arrow Outlines 4.Group 1.Stroke 1
    'assets.0.layers.0.shapes.0.it.1.c.k': staticWhite,
    // arrow Outlines 2.Group 3.Stroke 1
    'layers.1.shapes.0.it.1.c.k': staticWhite,
    // arrow Outlines.Group 1.Stroke 1
    'layers.2.shapes.0.it.1.c.k': staticWhite,
    // arrow Outlines.Group 2.Stroke 1
    'layers.2.shapes.1.it.1.c.k': staticWhite
  })

  return {
    neutral: {
      spin: iconRefreshSpin,
      pull: iconRefreshPull
    },
    white: { spin: iconRefreshSpinWhite, pull: iconRefreshPullWhite }
  }
})

const useStyles = makeStyles(() => ({
  root: {
    width: '100%',
    position: 'absolute',
    height: 20,
    zIndex: 10
  }
}))

const interpolateTranslateY = (scrollAnim: Animated.Value) =>
  scrollAnim.interpolate({
    inputRange: [-24, 0],
    outputRange: [10, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

const interpolateHitTopOpacity = (scrollAnim: Animated.Value, scrollDistance) =>
  scrollAnim.interpolate({
    inputRange: [-60, scrollDistance, scrollDistance + 12],
    outputRange: [1, 1, 0],
    extrapolateRight: 'clamp'
  })

const interpolateOpacity = (scrollAnim: Animated.Value) =>
  scrollAnim.interpolate({
    inputRange: [-60, -16],
    outputRange: [1, 0],
    extrapolateRight: 'clamp'
  })

type UseOverflowHandlersConfig = {
  isRefreshing?: boolean | null
  scrollResponder?: FlatList<any> | Animated.FlatList<any> | ScrollView | null
  onRefresh?: (() => void) | null
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
}

/**
 * A helper hook to get desired pull to refresh behavior.
 * 1. Momentum scrolling does not trigger pull to refresh
 */
export const useOverflowHandlers = ({
  isRefreshing,
  scrollResponder,
  onRefresh,
  onScroll
}: UseOverflowHandlersConfig) => {
  const scrollAnim = useRef(new Animated.Value(0)).current

  const [isMomentumScroll, setIsMomentumScroll] = useState(false)
  const currentYOffset = useRef(0)
  const wasRefreshing = usePrevious(isRefreshing)

  const scrollTo = useCallback(
    (y: number, animated = true) => {
      if (scrollResponder && 'scrollTo' in scrollResponder) {
        scrollResponder?.scrollTo({ y, animated })
      }
      if (scrollResponder && 'scrollToOffset' in scrollResponder) {
        scrollResponder?.scrollToOffset({ offset: y })
      }
    },
    [scrollResponder]
  )

  useEffect(() => {
    if (!isRefreshing && wasRefreshing && isMomentumScroll) {
      // If we don't wait, then this triggers too quickly causing scrollToTop
      // when user is already engaging with content
      const timeout = setTimeout(() => {
        if (currentYOffset.current < 0) scrollTo(0)
      }, DEBOUNCE_TIME_MS)
      return () => clearTimeout(timeout)
    }
  }, [isRefreshing, wasRefreshing, scrollTo, isMomentumScroll])

  const handleScroll = useCallback(
    (e) => {
      currentYOffset.current = e.nativeEvent.contentOffset.y
      onScroll?.(e)
    },
    [onScroll]
  )

  const onScrollBeginDrag = useCallback(
    (e) => {
      currentYOffset.current = e.nativeEvent.contentOffset.y
      setIsMomentumScroll(false)
    },
    [setIsMomentumScroll]
  )

  const onScrollEndDrag = useCallback(
    (e) => {
      currentYOffset.current = e.nativeEvent.contentOffset.y
      setIsMomentumScroll(true)
      if (isRefreshing && currentYOffset.current <= 0) {
        scrollTo(-50)
      }
    },
    [setIsMomentumScroll, scrollTo, isRefreshing]
  )

  const attachedHandleScroll = attachToScroll(scrollAnim, {
    listener: handleScroll
  })

  return {
    isRefreshing: onRefresh ? Boolean(isRefreshing) : undefined,
    isRefreshDisabled: isMomentumScroll,
    handleRefresh: onRefresh,
    scrollAnim,
    handleScroll: attachedHandleScroll,
    onScrollBeginDrag,
    onScrollEndDrag
  }
}

type PullToRefreshProps = {
  isRefreshing?: boolean
  onRefresh?: () => void
  scrollAnim?: Animated.Value
  isRefreshDisabled?: boolean
  topOffset?: number
  color?: string
  yOffsetDisappearance?: number
}

/**
 * Custom pull to refresh to be used with React Native ScrollViews
 * (FlatList, SectionList, etc.).
 *
 * Usage:
 * ```
 * const scrollAnim = useRef(new Animated.Value(0)).current
 *
 * const MyList = () => {
 *  return (
 *    <View>
 *      <PullToRefresh
 *        isRefreshing={}
 *        onRefresh={}
 *      />
 *      <ScrollView
 *        onScroll={attachToScroll(scrollAnim)}
 *        {...props}
 *      />
 *  )
 * }
 * ```
 *
 * Two usage modes of PullToRefresh are provided.
 * If the PullToRefresh is intended to appear in the overscroll
 * space above the view, see `useOverscrollHandlers`
 * Otherwise, the component may suffice.
 */
export const PullToRefresh = ({
  isRefreshing,
  onRefresh,
  isRefreshDisabled,
  scrollAnim,
  topOffset = 0,
  yOffsetDisappearance = 0,
  color
}: PullToRefreshProps) => {
  const styles = useStyles()
  const wasRefreshing = usePrevious(isRefreshing)

  const [didHitTop, setDidHitTop] = useState(false)
  const hitTop = useRef(false)

  const [shouldShowSpinner, setShouldShowSpinner] = useState(false)
  const animationRef = useRef<LottieView | null>()

  const { neutral, white } = useAnimations()
  const { spin, pull } = color ? white : neutral
  const colorizedIcon = shouldShowSpinner ? spin : pull

  const handleAnimationFinish = useCallback(
    (isCancelled: boolean) => {
      if (!isCancelled) {
        setShouldShowSpinner(true)
        setImmediate(() => {
          animationRef.current?.play()
        })
      }
    },
    [setShouldShowSpinner]
  )

  useEffect(() => {
    if (
      isRefreshDisabled !== undefined
        ? !isRefreshing && isRefreshDisabled
        : !isRefreshing && wasRefreshing
    ) {
      setDidHitTop(false)
      setShouldShowSpinner(false)
      animationRef.current?.reset()
    }
  }, [isRefreshing, hitTop, wasRefreshing, isRefreshDisabled])

  const listenerRef = useRef<string>()

  const handleScroll = useCallback(
    ({ value }: { value: number }) => {
      if (value === 0) {
        hitTop.current = false
        setDidHitTop(false)
      }
      if (value < -1 * PULL_DISTANCE && !hitTop.current && !isRefreshDisabled) {
        hitTop.current = true
        setDidHitTop(true)
        haptics.light()
        onRefresh?.()
        animationRef.current?.play()
      }
    },
    [onRefresh, isRefreshDisabled]
  )

  useEffect(() => {
    listenerRef.current = scrollAnim?.addListener(handleScroll)
    return () => {
      if (listenerRef.current) {
        scrollAnim?.removeListener(listenerRef.current)
      }
    }
  }, [scrollAnim, handleScroll])

  return scrollAnim ? (
    <Animated.View
      style={[
        styles.root,
        {
          top: topOffset,
          transform: [
            {
              translateY: interpolateTranslateY(scrollAnim)
            }
          ],
          opacity: didHitTop
            ? interpolateHitTopOpacity(scrollAnim, yOffsetDisappearance)
            : interpolateOpacity(scrollAnim)
        }
      ]}
    >
      <LottieView
        style={{ height: '100%', width: '100%' }}
        ref={(animation) => (animationRef.current = animation)}
        loop={shouldShowSpinner}
        autoPlay={false}
        source={colorizedIcon}
        onAnimationFinish={handleAnimationFinish}
      />
    </Animated.View>
  ) : null
}
