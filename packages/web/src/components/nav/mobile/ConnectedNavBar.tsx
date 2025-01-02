import { useCallback, useContext } from 'react'

import { Name, Status } from '@audius/common/models'
import {
  accountSelectors,
  notificationsSelectors,
  searchResultsPageSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { make, useRecord } from 'common/store/analytics/actions'
import {
  RouterContext,
  SlideDirection
} from 'components/animated-switch/RouterContextProvider'
import { AppState } from 'store/types'
import { getIsIOS } from 'utils/browser'
import { push, goBack } from 'utils/navigation'
import { withRouter, RouteComponentProps } from 'utils/withRouter'

import NavBar from './NavBar'

const { NOTIFICATION_PAGE, SETTINGS_PAGE, AUDIO_PAGE } = route
const { getSearchStatus } = searchResultsPageSelectors
const { getNotificationUnviewedCount } = notificationsSelectors
const { getHasAccount, getAccountStatus } = accountSelectors

type ConnectedNavBarProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps<any>

const ConnectedNavBar = ({
  goToRoute,
  hasAccount,
  accountStatus,
  history,
  searchStatus,
  notificationCount,
  goBack
}: ConnectedNavBarProps) => {
  const { setStackReset, setSlideDirection } = useContext(RouterContext)

  const search = (query: string) => {
    history.push({
      pathname: history.location.pathname,
      search: query ? new URLSearchParams({ query }).toString() : undefined
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
      isSignedIn={hasAccount}
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
    hasAccount: getHasAccount(state),
    accountStatus: getAccountStatus(state),
    searchStatus: getSearchStatus(state),
    notificationCount: getNotificationUnviewedCount(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(push(route)),
    goBack: () => dispatch(goBack())
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedNavBar)
)
