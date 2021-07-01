import React, { useContext, useEffect } from 'react'

import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import MobilePageContainer from 'components/general/MobilePageContainer'
import NavContext, { LeftPreset } from 'containers/nav/store/context'
import {
  getId,
  getPageTitle,
  getUserList
} from 'containers/notification-users-page/store/selectors'
import UserList from 'containers/user-list/UserList'
import { loadMore } from 'containers/user-list/store/actions'
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
