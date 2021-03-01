import React, { useState, useContext, useCallback, useEffect } from 'react'
import { ReactComponent as AudiusLogo } from 'assets/img/audiusLogoHorizontal.svg'
import SearchBar from 'components/search-bar/SearchBar'
import cn from 'classnames'
import {
  IconCaretRight,
  IconRemove,
  IconNotification,
  IconSettings
} from '@audius/stems'

import styles from './NavBar.module.css'
import { useTransition, animated } from 'react-spring'
import { Status } from 'store/types'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'containers/nav/store/context'
import IconButton from 'components/general/IconButton'
import { formatCount } from 'utils/formatUtil'
import {
  RouterContext,
  SlideDirection
} from 'containers/animated-switch/RouterContextProvider'
import { History } from 'history'
import { getIsIOS } from 'utils/browser'
import { OpenNotificationsMessage } from 'services/native-mobile-interface/notifications'
import { useLocation } from 'react-router-dom'
import { isMatrix } from 'utils/theme/theme'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

interface NavBarProps {
  isLoading: boolean
  isSignedIn: boolean
  searchStatus: Status
  notificationCount: number
  signUp: () => void
  goToNotificationPage: () => void
  goToSettingsPage: () => void
  search: (term: string) => void
  logoClicked: () => void
  goBack: () => void
  history: History<any>
}

const messages = {
  signUp: 'Sign Up',
  searchPlaceholder: 'Search Audius'
}

const NavBar = ({
  isLoading,
  isSignedIn,
  searchStatus,
  notificationCount,
  search,
  signUp,
  goToNotificationPage,
  goToSettingsPage,
  logoClicked,
  goBack,
  history: {
    location: { pathname }
  }
}: NavBarProps) => {
  const { leftElement, centerElement, rightElement } = useContext(NavContext)!

  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { setStackReset } = useContext(RouterContext)
  const beginSearch = useCallback(() => {
    setStackReset(true)
    setImmediate(() => search(searchValue))
  }, [setStackReset, search, searchValue])

  useEffect(() => {
    const splitPath = pathname.split('/')
    const isSearch = splitPath.length > 1 && splitPath[1] === 'search'
    if (!isSearch) {
      setIsSearching(false)
    }
  }, [pathname])

  const onCloseSearch = () => {
    setIsSearching(false)
    setSearchValue('')
  }

  const onClickNotifications = useCallback(() => {
    if (NATIVE_MOBILE) {
      new OpenNotificationsMessage().send()
    } else {
      goToNotificationPage()
    }
  }, [goToNotificationPage])

  const logoTransitions = useTransition(!isSearching, null, {
    from: {
      opacity: 0,
      transform: 'scale(0.9)'
    },
    enter: {
      opacity: 1,
      transform: 'scale(1)'
    },
    leave: {
      opacity: 0,
      transform: 'scale(0.9)'
    },
    config: {
      duration: 150
    }
  })

  const { setSlideDirection } = useContext(RouterContext)
  const location = useLocation()

  const onGoBack = useCallback(() => {
    // @ts-ignore
    if (location.state?.fromNativeNotifications) {
      onClickNotifications()
    } else {
      goBack()
    }
  }, [goBack, onClickNotifications, location])

  const goBackAndResetSlide = useCallback(() => {
    onGoBack()
    setSlideDirection(SlideDirection.FROM_LEFT)
  }, [onGoBack, setSlideDirection])

  const goBackAndDoNotAnimate = useCallback(() => {
    setStackReset(true)
    setImmediate(onGoBack)
  }, [setStackReset, onGoBack])

  let left = null
  if (leftElement === LeftPreset.BACK) {
    left = (
      <IconButton
        className={cn(styles.leftIconButton, styles.caretRight)}
        icon={<IconCaretRight />}
        onClick={onGoBack}
      />
    )
  } else if (leftElement === LeftPreset.CLOSE) {
    left = (
      <IconButton
        className={styles.leftIconButton}
        icon={<IconRemove />}
        onClick={getIsIOS() ? goBackAndResetSlide : goBackAndDoNotAnimate}
      />
    )
  } else if (leftElement === LeftPreset.CLOSE_NO_ANIMATION) {
    left = (
      <IconButton
        className={styles.leftIconButton}
        icon={<IconRemove />}
        onClick={goBackAndDoNotAnimate}
      />
    )
  } else if (leftElement === LeftPreset.NOTIFICATION && !isSignedIn) {
    left = (
      <button className={styles.signUpButton} onClick={signUp}>
        {messages.signUp}
      </button>
    )
  } else if (leftElement === LeftPreset.NOTIFICATION && isSignedIn) {
    left = (
      <>
        <IconButton
          className={cn(styles.leftIconButton, styles.notificationIcon, {
            [styles.hasUnread]: notificationCount > 0
          })}
          icon={<IconNotification />}
          onClick={onClickNotifications}
        />
        {notificationCount > 0 && (
          <div className={styles.iconTag}>{formatCount(notificationCount)}</div>
        )}
      </>
    )
  } else if (leftElement === LeftPreset.SETTINGS && isSignedIn) {
    left = (
      <IconButton
        className={styles.leftIconButton}
        icon={<IconSettings />}
        onClick={goToSettingsPage}
      />
    )
  } else {
    left = leftElement
  }

  const matrix = isMatrix()

  return (
    <div className={styles.container}>
      <div
        className={cn(styles.leftElement, {
          [styles.isLoading]: isLoading
        })}
      >
        {left}
      </div>
      {centerElement === CenterPreset.LOGO && (
        <div
          className={cn(styles.logo, { [styles.matrixLogo]: matrix })}
          onClick={logoClicked}
        >
          {logoTransitions.map(
            ({ item, props, key }) =>
              item && (
                <animated.div style={props} key={key}>
                  <AudiusLogo />
                </animated.div>
              )
          )}
        </div>
      )}
      {typeof centerElement === 'string' &&
        !Object.values(CenterPreset).includes(centerElement as any) && (
          <div className={styles.centerText}> {centerElement} </div>
        )}
      <div
        className={cn(styles.rightElement, {
          [styles.isLoading]: isLoading
        })}
      >
        {rightElement === RightPreset.SEARCH ? (
          <SearchBar
            open={isSearching}
            onOpen={() => {
              setIsSearching(true)
            }}
            onClose={onCloseSearch}
            value={searchValue}
            onSearch={setSearchValue}
            placeholder={messages.searchPlaceholder}
            showHeader={false}
            className={cn(
              styles.searchBar,
              { [styles.searchBarClosed]: !isSearching },
              { [styles.searchBarClosedSignedOut]: !isSearching && !isSignedIn }
            )}
            iconClassname={styles.searchIcon}
            beginSearch={beginSearch}
            status={searchStatus}
          />
        ) : (
          rightElement
        )}
      </div>
    </div>
  )
}

export default NavBar
