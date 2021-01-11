import React, { useCallback, useState } from 'react'
import { AppState } from 'store/types'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { push as pushRoute } from 'connected-react-router'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  FAVORITES_PAGE,
  profilePage
} from 'utils/route'
import { getUserHandle } from 'store/account/selectors'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import BottomBar from 'components/bottom-bar/BottomBar'
import {
  openSignOn,
  showRequiresAccountModal
} from 'containers/sign-on/store/actions'
import { isDarkMode } from 'utils/theme/theme'
import { setTab } from 'containers/explore-page/store/actions'
import { Tabs } from 'containers/explore-page/store/types'

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
  const currentRoute = history.location.pathname
  if (navRoutes.has(currentRoute) && lastNavRoute !== currentRoute) {
    setNavRoute(currentRoute)
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
