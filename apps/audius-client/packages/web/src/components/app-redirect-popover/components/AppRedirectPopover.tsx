import { Fragment, useState, useEffect } from 'react'

import { Button, ButtonType } from '@audius/stems'
import { matchPath } from 'react-router-dom'
import { animated, useTransition } from 'react-spring'

import AppIcon from 'assets/img/appIcon240.png'
import { isMobile } from 'utils/clientUtil'
import { APP_REDIRECT, getPathname, SIGN_UP_PAGE } from 'utils/route'

import styles from './AppRedirectPopover.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  openInApp: 'Open in Audius App',
  notNow: 'Not Now'
}

const springConfigFast = {
  mass: 1,
  tension: 275,
  friction: 35
}

const springConfigSlow = {
  mass: 1,
  tension: 200,
  friction: 35
}

const springProps = {
  drawer: {
    from: {
      opacity: 0.6,
      transform: 'translateY(304px)'
    },
    enter: {
      opacity: 1,
      transform: 'translateY(0)'
    },
    leave: {
      opacity: 1,
      transform: 'translateY(304px)'
    },
    config: springConfigFast
  },
  element: {
    from: {
      transform: 'scale(0.5)',
      opacity: 1
    },
    enter: {
      transform: 'scale(1)',
      opacity: 1
    },
    leave: {
      transform: 'scale(1)',
      opacity: 1
    },
    config: springConfigSlow
  },
  background: {
    from: {
      opacity: 0
    },
    enter: {
      opacity: 1
    },
    leave: {
      opacity: 0
    }
  }
}

type AppRedirectPopoverProps = {
  enablePopover: boolean
  incrementScroll: () => void
  decrementScroll: () => void
  onBeforeClickApp?: () => void
  onBeforeClickDismissed?: () => void
}

/**
 * Popover that presents an option to open the current
 * page in the mobile app, or redirects to the app store
 * if no app is installed.
 */
const AppRedirectPopover = ({
  enablePopover,
  incrementScroll,
  decrementScroll,
  onBeforeClickApp = () => {},
  onBeforeClickDismissed = () => {}
}: AppRedirectPopoverProps) => {
  const [isDismissed, setIsDismissed] = useState(false)

  const [animDelay, setAnimDelay] = useState(false)
  useEffect(() => {
    enablePopover && setTimeout(() => setAnimDelay(true), 500)
  }, [enablePopover])

  const shouldShow = animDelay && !isDismissed && isMobile() && !NATIVE_MOBILE

  useEffect(() => {
    shouldShow && incrementScroll()
  }, [incrementScroll, shouldShow])

  const backgroundTransitions = useTransition(
    shouldShow,
    null,
    springProps.background
  )
  const elementTransitions = useTransition(
    shouldShow,
    null,
    springProps.element
  )
  const drawerTransitions = useTransition(shouldShow, null, springProps.drawer)

  const onClick = () => {
    onBeforeClickApp()
    const pathname = getPathname()
    const newHref = `https://redirect.audius.co${APP_REDIRECT}${pathname}`
    // If we're on the signup page, copy the URL to clipboard on app redirect
    // The app can then read the URL on load, persisting through install, to associate referrals
    if (
      window.isSecureContext &&
      matchPath(window.location.pathname, { path: SIGN_UP_PAGE, exact: true })
    ) {
      navigator.clipboard.writeText(window.location.href)
    }
    window.location.href = newHref
    decrementScroll()
  }

  const onDismiss = () => {
    onBeforeClickDismissed()
    setIsDismissed(true)
    decrementScroll()
  }

  return (
    <>
      {backgroundTransitions.map(({ item, props, key }) => {
        return (
          item && (
            <animated.div style={props} className={styles.container} key={key}>
              {drawerTransitions.map(({ item, props, key }) => {
                return (
                  item && (
                    <animated.div
                      style={props}
                      className={styles.popover}
                      key={key}>
                      {elementTransitions.map(
                        ({ item: newItem, props, key }) => {
                          return (
                            <Fragment key={key}>
                              <div
                                className={styles.clickableArea}
                                onClick={onClick}
                              />
                              {newItem && (
                                <animated.div
                                  style={{
                                    ...props,
                                    backgroundImage: `url(${AppIcon})`,
                                    backgroundSize: 'contain'
                                  }}
                                  className={styles.logo}
                                />
                              )}
                              {newItem && (
                                <animated.div
                                  className={styles.mainButtonContainer}
                                  style={props}>
                                  <Button
                                    className={styles.mainButton}
                                    type={ButtonType.WHITE}
                                    text={messages.openInApp}
                                    onClick={onClick}
                                  />
                                </animated.div>
                              )}
                              {newItem && (
                                <animated.div
                                  style={props}
                                  className={styles.notNow}
                                  onClick={() => onDismiss()}>
                                  {messages.notNow}
                                </animated.div>
                              )}
                            </Fragment>
                          )
                        }
                      )}
                    </animated.div>
                  )
                )
              })}
            </animated.div>
          )
        )
      })}
    </>
  )
}

export default AppRedirectPopover
