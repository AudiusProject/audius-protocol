import { useCallback, useState } from 'react'

import {
  accountSelectors,
  explorePageActions,
  ExplorePageTabs
} from '@audius/common/store'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import {
  openSignOn,
  showRequiresAccountModal
} from 'common/store/pages/signon/actions'
import BottomBar from 'components/bottom-bar/BottomBar'
import { AppState } from 'store/types'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  profilePage,
  getPathname,
  LIBRARY_PAGE
} from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'
const { setTab } = explorePageActions
const { getUserHandle } = accountSelectors

type ConnectedBottomBarProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps<any>

const ConnectedBottomBar = ({
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
    LIBRARY_PAGE,
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

  const goToLibrary = useCallback(() => {
    resetExploreTab()
    if (!handle) {
      openSignOn()
    } else {
      goToRoute(LIBRARY_PAGE)
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
      onClickLibrary={goToLibrary}
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
      dispatch(setTab({ tab: ExplorePageTabs.FOR_YOU }))
    }
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedBottomBar)
)
