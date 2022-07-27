import { useCallback, useContext } from 'react'

import { Name, Status } from '@audius/common'
import { push as pushRoute, goBack } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import {
  getAccountUser,
  getAccountStatus
} from 'common/store/account/selectors'
import { getNotificationUnviewedCount } from 'common/store/notifications/selectors'
import { getSearchStatus } from 'common/store/pages/search-results/selectors'
import {
  RouterContext,
  SlideDirection
} from 'components/animated-switch/RouterContextProvider'
import { openSignOn } from 'pages/sign-on/store/actions'
import { make, useRecord } from 'store/analytics/actions'
import { AppState } from 'store/types'
import { getIsIOS } from 'utils/browser'
import {
  TRENDING_PAGE,
  NOTIFICATION_PAGE,
  SETTINGS_PAGE,
  AUDIO_PAGE
} from 'utils/route'

import NavBar from './NavBar'

type ConnectedNavBarProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps<any>

const ConnectedNavBar = ({
  goToRoute,
  account,
  accountStatus,
  openSignOn,
  history,
  searchStatus,
  notificationCount,
  goBack
}: ConnectedNavBarProps) => {
  const { setStackReset, setSlideDirection } = useContext(RouterContext)

  const search = (query: string) => {
    history.push({
      pathname: `/search/${query}`,
      state: {}
    })
  }

  const goToTrending = useCallback(() => {
    goToRoute(TRENDING_PAGE)
  }, [goToRoute])

  const record = useRecord()
  const goToNotificationPage = useCallback(() => {
    if (getIsIOS()) {
      setSlideDirection(SlideDirection.FROM_RIGHT)
    } else {
      setStackReset(true)
    }
    setImmediate(() => goToRoute(NOTIFICATION_PAGE))
    record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
  }, [goToRoute, setStackReset, setSlideDirection, record])

  const goToSettingsPage = useCallback(() => {
    setStackReset(true)
    setImmediate(() => goToRoute(SETTINGS_PAGE))
  }, [goToRoute, setStackReset])

  const signUp = useCallback(() => {
    setStackReset(true)
    setImmediate(() => openSignOn(false))
  }, [openSignOn, setStackReset])

  const goToAudioPage = useCallback(() => {
    setStackReset(true)
    setImmediate(() => goToRoute(AUDIO_PAGE))
  }, [goToRoute, setStackReset])

  return (
    <NavBar
      isSignedIn={!!account}
      isLoading={accountStatus === Status.LOADING}
      signUp={signUp}
      notificationCount={notificationCount}
      goToNotificationPage={goToNotificationPage}
      goToSettingsPage={goToSettingsPage}
      search={search}
      logoClicked={goToTrending}
      searchStatus={searchStatus}
      goBack={goBack}
      history={history}
      goToAudioPage={goToAudioPage}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    account: getAccountUser(state),
    accountStatus: getAccountStatus(state),
    searchStatus: getSearchStatus(state),
    notificationCount: getNotificationUnviewedCount(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    openSignOn: (signIn: boolean) => dispatch(openSignOn(signIn)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    goBack: () => dispatch(goBack())
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedNavBar)
)
