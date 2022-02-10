import React, { useContext, useEffect } from 'react'

import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { loadMore } from 'common/store/user-list/actions'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import UserList from 'components/user-list/UserList'
import {
  getId,
  getPageTitle,
  getUserList
} from 'pages/notification-users-page/store/selectors'
import { AppState } from 'store/types'

import { setNotificationId } from './store/actions'

export const USER_LIST_TAG = 'NOTIFICATION'

// Eventually calculate a custom page size
export const PAGE_SIZE = 15

export type OwnProps = {}

type NotificationUsersPage = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps> &
  RouteComponentProps<{ notificationId: string }>

const NotificationUsersPage = ({
  pageTitle,
  match,
  loadMore,
  setNotificationId
}: NotificationUsersPage) => {
  // Set the Nav Header
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(pageTitle)
    setRight(null)
  }, [setLeft, setCenter, setRight, pageTitle])

  // Set the notification id from the url route param
  const {
    params: { notificationId }
  } = match
  useEffect(() => {
    if (notificationId) {
      setNotificationId(notificationId)
      loadMore()
    }
  }, [notificationId, setNotificationId, loadMore])

  return (
    <MobilePageContainer fullHeight>
      <UserList
        stateSelector={getUserList}
        tag={USER_LIST_TAG}
        pageSize={PAGE_SIZE}
      />
    </MobilePageContainer>
  )
}

function mapStateToProps(state: AppState) {
  return {
    pageTitle: getPageTitle(state),
    notificationId: getId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setNotificationId: (id: string) => dispatch(setNotificationId(id)),
    loadMore: () => dispatch(loadMore(USER_LIST_TAG))
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(NotificationUsersPage)
)
