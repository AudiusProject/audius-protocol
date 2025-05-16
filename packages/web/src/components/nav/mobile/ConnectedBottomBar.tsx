import { useCallback, useState } from 'react'

import { selectIsGuestAccount, useCurrentAccount } from '@audius/common/api'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'

import {
  openSignOn,
  showRequiresAccountToast
} from 'common/store/pages/signon/actions'
import BottomBar from 'components/bottom-bar/BottomBar'
import { push } from 'utils/navigation'
import { getPathname } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'
const { FEED_PAGE, TRENDING_PAGE, EXPLORE_PAGE, profilePage, LIBRARY_PAGE } =
  route

type ConnectedBottomBarProps = RouteComponentProps<any>

const ConnectedBottomBar = ({ history }: ConnectedBottomBarProps) => {
  const dispatch = useDispatch()
  const { data: accountData } = useCurrentAccount({
    select: (account) => ({
      handle: account?.user?.handle,
      isGuestAccount: selectIsGuestAccount(account)
    })
  })
  const { handle, isGuestAccount } = accountData ?? {}
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

  const goToRoute = useCallback(
    (route: string) => {
      dispatch(push(route))
    },
    [dispatch]
  )

  const handleOpenSignOn = useCallback(() => {
    dispatch(openSignOn(false))
    dispatch(showRequiresAccountToast())
  }, [dispatch])

  const goToFeed = useCallback(() => {
    if (!handle) {
      handleOpenSignOn()
    } else {
      goToRoute(FEED_PAGE)
    }
  }, [goToRoute, handle, handleOpenSignOn])

  const goToTrending = useCallback(() => {
    goToRoute(TRENDING_PAGE)
  }, [goToRoute])

  const goToExplore = useCallback(() => {
    goToRoute(EXPLORE_PAGE)
  }, [goToRoute])

  const goToLibrary = useCallback(() => {
    if (!handle && !isGuestAccount) {
      handleOpenSignOn()
    } else {
      goToRoute(LIBRARY_PAGE)
    }
  }, [goToRoute, handle, isGuestAccount, handleOpenSignOn])

  const goToProfile = useCallback(() => {
    if (!handle) {
      handleOpenSignOn()
    } else {
      goToRoute(profilePage(handle))
    }
  }, [goToRoute, handle, handleOpenSignOn])

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

export default withRouter(ConnectedBottomBar)
