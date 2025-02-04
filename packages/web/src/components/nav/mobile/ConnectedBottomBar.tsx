import { useCallback, useState } from 'react'

import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import {
  openSignOn,
  showRequiresAccountToast
} from 'common/store/pages/signon/actions'
import BottomBar from 'components/bottom-bar/BottomBar'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'
import { getPathname } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'
const { FEED_PAGE, TRENDING_PAGE, EXPLORE_PAGE, profilePage, LIBRARY_PAGE } =
  route
const { getUserHandle, getIsGuestAccount } = accountSelectors

type ConnectedBottomBarProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps<any>

const ConnectedBottomBar = ({
  goToRoute,
  handle,
  isGuestAccount,
  history,
  openSignOn
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
    if (!handle) {
      openSignOn()
    } else {
      goToRoute(FEED_PAGE)
    }
  }, [goToRoute, handle, openSignOn])

  const goToTrending = useCallback(() => {
    goToRoute(TRENDING_PAGE)
  }, [goToRoute])

  const goToExplore = useCallback(() => {
    goToRoute(EXPLORE_PAGE)
  }, [goToRoute])

  const goToLibrary = useCallback(() => {
    if (!handle && !isGuestAccount) {
      openSignOn()
    } else {
      goToRoute(LIBRARY_PAGE)
    }
  }, [goToRoute, handle, isGuestAccount, openSignOn])

  const goToProfile = useCallback(() => {
    if (!handle) {
      openSignOn()
    } else {
      goToRoute(profilePage(handle))
    }
  }, [goToRoute, handle, openSignOn])

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
    handle: getUserHandle(state),
    isGuestAccount: getIsGuestAccount(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(push(route)),
    openSignOn: () => {
      dispatch(openSignOn(false))
      dispatch(showRequiresAccountToast())
    }
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedBottomBar)
)
