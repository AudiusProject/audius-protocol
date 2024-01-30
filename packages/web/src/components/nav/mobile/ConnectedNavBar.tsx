import { useCallback, useContext } from 'react'

import {
  accountSelectors,
  notificationsSelectors,
  searchResultsPageSelectors
} from '@audius/common'
import { Name, Status } from '@audius/common/models'
import { push as pushRoute, goBack } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { make, useRecord } from 'common/store/analytics/actions'
import {
  RouterContext,
  SlideDirection
} from 'components/animated-switch/RouterContextProvider'
import { AppState } from 'store/types'
import { getIsIOS } from 'utils/browser'
import { NOTIFICATION_PAGE, SETTINGS_PAGE, AUDIO_PAGE } from 'utils/route'

import NavBar from './NavBar'
const { getSearchStatus } = searchResultsPageSelectors
const { getNotificationUnviewedCount } = notificationsSelectors
const { getAccountUser, getAccountStatus } = accountSelectors

type ConnectedNavBarProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps<any>

const ConnectedNavBar = ({
  goToRoute,
  account,
  accountStatus,
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
  }, [setStackReset])

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
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    goBack: () => dispatch(goBack())
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedNavBar)
)
