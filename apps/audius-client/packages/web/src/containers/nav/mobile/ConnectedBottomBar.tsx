import React, { useCallback, useState } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { getUserHandle } from 'common/store/account/selectors'
import BottomBar from 'components/bottom-bar/BottomBar'
import { setTab } from 'containers/explore-page/store/actions'
import { Tabs } from 'containers/explore-page/store/types'
import {
  openSignOn,
  showRequiresAccountModal
} from 'containers/sign-on/store/actions'
import { AppState } from 'store/types'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  FAVORITES_PAGE,
  profilePage,
  getPathname
} from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type ConnectedBottomBarProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps<any>

const ConnectedNavBar = ({
  goToRoute,
  handle,
  history,
  openSignOn,
  resetExploreTab
}: ConnectedBottomBarProps) => {
  const userProfilePage = handle ? profilePage(handle) : null
  const navRoutes = new Set([
    FEED_PAGE,
    TRENDING_PAGE,
    EXPLORE_PAGE,
    FAVORITES_PAGE,
    userProfilePage
  ])

  const [lastNavRoute, setNavRoute] = useState(FEED_PAGE)
  const currentRoute = getPathname(history.location)

  if (lastNavRoute !== currentRoute) {
    // If the current route isn't what we memoized, check if it's a nav route
    // and update the current route if so
    if (navRoutes.has(currentRoute)) {
      setNavRoute(currentRoute)
    }

    // If we are in native mobile and we entered the app via notification directly,
    // update the current route to the current page so that none of the
    // nav bar items are highlighted
    if (
      NATIVE_MOBILE &&
      // @ts-ignore
      history.location.state?.fromNativeNotifications
    ) {
      setNavRoute(currentRoute)
    }
  }

  const goToFeed = useCallback(() => {
    resetExploreTab()
    if (!handle) {
      openSignOn()
    } else {
      goToRoute(FEED_PAGE)
    }
  }, [goToRoute, handle, openSignOn, resetExploreTab])

  const goToTrending = useCallback(() => {
    resetExploreTab()
    goToRoute(TRENDING_PAGE)
  }, [goToRoute, resetExploreTab])

  const goToExplore = useCallback(() => {
    resetExploreTab()
    goToRoute(EXPLORE_PAGE)
  }, [goToRoute, resetExploreTab])

  const goToFavorites = useCallback(() => {
    resetExploreTab()
    if (!handle) {
      openSignOn()
    } else {
      goToRoute(FAVORITES_PAGE)
    }
  }, [goToRoute, handle, openSignOn, resetExploreTab])

  const goToProfile = useCallback(() => {
    resetExploreTab()
    if (!handle) {
      openSignOn()
    } else {
      goToRoute(profilePage(handle))
    }
  }, [goToRoute, handle, openSignOn, resetExploreTab])

  return (
    <BottomBar
      currentPage={lastNavRoute}
      userProfilePageRoute={userProfilePage}
      onClickFeed={goToFeed}
      onClickTrending={goToTrending}
      onClickExplore={goToExplore}
      onClickFavorites={goToFavorites}
      onClickProfile={goToProfile}
      isDarkMode={isDarkMode()}
      isMatrixMode={isMatrix()}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    handle: getUserHandle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    openSignOn: () => {
      dispatch(openSignOn(false))
      dispatch(showRequiresAccountModal())
    },
    resetExploreTab: () => {
      dispatch(setTab(Tabs.FOR_YOU))
    }
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedNavBar)
)
