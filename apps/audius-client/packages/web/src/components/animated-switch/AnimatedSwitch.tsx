import {
  useContext,
  useEffect,
  ReactNode,
  useRef,
  useState,
  useCallback,
  CSSProperties
} from 'react'

import { Switch, useHistory } from 'react-router-dom'
import { useTransition, animated } from 'react-spring'

import useInstanceVar from 'common/hooks/useInstanceVar'
import { getIsIOS } from 'utils/browser'
import {
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
  TRENDING_PAGE,
  NOTIFICATION_PAGE,
  FEED_PAGE,
  SAVED_PAGE,
  EXPLORE_PAGE,
  profilePage,
  getPathname
} from 'utils/route'

import { RouterContext, SlideDirection } from './RouterContextProvider'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const DISABLED_PAGES = new Set([SIGN_IN_PAGE, SIGN_UP_PAGE])

if (!getIsIOS()) {
  DISABLED_PAGES.add(NOTIFICATION_PAGE)
}

const wobble = {
  mass: 1,
  tension: 350,
  friction: 25,
  clamp: true
}

const slideInLeftTransition = {
  from: { opacity: 1, transform: 'translate3d(100%,0,0)' },
  enter: { opacity: 1, transform: 'translate3d(0,0,0)' },
  leave: { opacity: 0, transform: 'translate3d(-80%,0,0)' },
  config: wobble,
  immediate: false
}

const slideInRightTransition = {
  from: { opacity: 1, transform: 'translate3d(-100%,0,0)' },
  enter: { opacity: 1, transform: 'translate3d(0,0,0)' },
  leave: { opacity: 0, transform: 'translate3d(80%,0,0)' },
  config: wobble,
  immediate: false
}

const noTransition = {
  from: { opacity: 1, transform: 'translate3d(0,0,0)' },
  enter: { opacity: 1, transform: 'translate3d(0,0,0)' },
  leave: { opacity: 1, transform: 'translate3d(0,0,0)' },
  config: wobble,
  immediate: true
}

type AnimatedSwitchProps = {
  children: ReactNode
  handle: string | null
  isInitialPage: boolean
}

const AnimatedSwitch = ({
  children,
  handle,
  isInitialPage
}: AnimatedSwitchProps) => {
  const { stackReset, setStackReset, slideDirection } =
    useContext(RouterContext)
  const animationRef = useRef<HTMLDivElement>(null)
  const [disabled, setDisabled] = useState(false)

  const history = useHistory()
  const { location } = history

  const [getAnimation, setAnimation] = useInstanceVar(noTransition)
  // Maintain an instance var to track whether the navigation stack is reset (no animations)
  // so that `window.onpopstate` can know whether or not to set animations
  const [getIsStackResetting, setIsStackResetting] = useInstanceVar(false)

  // Go to page
  useEffect(() => {
    const animation =
      slideDirection === SlideDirection.FROM_LEFT
        ? slideInLeftTransition
        : slideInRightTransition
    setAnimation(animation)
    setIsStackResetting(false)
  }, [location, setAnimation, slideDirection, setIsStackResetting])

  // Reset
  useEffect(() => {
    if (stackReset) {
      setIsStackResetting(true)
      setAnimation(noTransition)
      setStackReset(false)
    }
  }, [stackReset, setStackReset, setAnimation, setIsStackResetting])

  // If on android & navigating between the bottom bar route, do not animate
  const isBaseRoute = useCallback(
    (udpatedRoute: string) => {
      if (getIsIOS() || !NATIVE_MOBILE) return false

      const userProfilePage = handle ? profilePage(handle) : ''
      const baseRoutes = [
        TRENDING_PAGE,
        FEED_PAGE,
        SAVED_PAGE,
        EXPLORE_PAGE,
        userProfilePage
      ]
      return (
        baseRoutes.includes(udpatedRoute) &&
        baseRoutes.includes(getPathname(location))
      )
    },
    [location, handle]
  )

  // Go back a page
  useEffect(() => {
    window.onpopstate = (e: any) => {
      if (
        !getIsStackResetting() &&
        !isBaseRoute(getPathname(e.target.location))
      ) {
        setAnimation(
          slideDirection === SlideDirection.FROM_LEFT
            ? slideInRightTransition
            : slideInLeftTransition
        )
      } else {
        setAnimation(noTransition)
      }
    }
  }, [setAnimation, slideDirection, getIsStackResetting, isBaseRoute])

  useEffect(() => {
    if (
      DISABLED_PAGES.has(getPathname(location)) ||
      // Don't animate on replace transitions
      history.action === 'REPLACE' ||
      // @ts-ignore
      location.state?.noAnimation
    ) {
      setDisabled(true)
    } else if (disabled) {
      setDisabled(false)
    }
  }, [location, history, disabled, setDisabled])

  const transitions = useTransition(
    location,
    (location) => getPathname(location),
    getAnimation()
  )

  const extraStyles: CSSProperties = {}
  if (disabled) {
    extraStyles.transform = 'none'
  }

  return transitions.map(({ item, props, state, key }) => {
    if (stackReset && state === 'leave') {
      return null
    }
    const transitionProps = stackReset ? {} : props
    return (
      <animated.div
        ref={animationRef}
        style={{
          ...transitionProps,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...extraStyles
        }}
        key={key}>
        <Switch location={item}>{children}</Switch>
      </animated.div>
    )
  })
}

export default AnimatedSwitch
