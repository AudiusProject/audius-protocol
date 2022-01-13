import React, { useCallback, useEffect } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import Status from 'common/models/Status'
import { AppState } from 'store/types'

import {
  markAsRead,
  markAllAsRead,
  hideNotification,
  setNotificationModal,
  unsubscribeUser,
  fetchNotifications,
  setNotificationUsers,
  markAllAsViewed,
  toggleNotificationPanel
} from './store/actions'
import {
  getNotificationHasLoaded,
  getNotificationStatus,
  getNotificationHasMore,
  getNotificationPanelIsOpen,
  getNotificationModalIsOpen,
  makeGetAllNotifications,
  getModalNotification
} from './store/selectors'

type OwnProps = {
  children: React.ComponentType<any>
  toggleNotificationPanel?: () => void
  isElectron?: boolean
}

type NotificationPanelProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps>

/** The notification panel displays the list of notifications w/ a
 * summary of each notification and a link to open the full
 * notification in a modal  */
const NotificationPanel = (props: NotificationPanelProps) => {
  const {
    setNotificationModal,
    hasMore,
    status,
    fetchNotifications,
    toggleNotificationPanel
  } = props

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const openNotifications = urlParams.get('openNotifications')
    if (openNotifications) {
      toggleNotificationPanel()
    }
  }, [toggleNotificationPanel])

  const onCloseNotificationModal = useCallback(() => {
    setNotificationModal(false)
  }, [setNotificationModal])

  const loadMore = useCallback(() => {
    if (!hasMore || status === Status.LOADING || status === Status.ERROR) return
    fetchNotifications()
  }, [hasMore, status, fetchNotifications])

  const childProps = {
    ...props,
    loadMore
  }

  const desktopProps = {
    onCloseNotificationModal
  }

  return <props.children {...childProps} {...desktopProps} />
}

function makeMapStateToProps() {
  const getNotifications = makeGetAllNotifications()

  const mapStateToProps = (state: AppState) => ({
    hasLoaded: getNotificationHasLoaded(state),
    status: getNotificationStatus(state),
    hasMore: getNotificationHasMore(state),
    notifications: getNotifications(state),
    panelIsOpen: getNotificationPanelIsOpen(state),
    modalIsOpen: getNotificationModalIsOpen(state),
    modalNotification: getModalNotification(state)
  })
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setNotificationUsers: (userIds: ID[], limit: number) =>
      dispatch(setNotificationUsers(userIds, limit)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    hideNotification: (notificationId: string) =>
      dispatch(hideNotification(notificationId)),
    markAsRead: (notificationId: string) =>
      dispatch(markAsRead(notificationId)),
    markAllAsRead: () => dispatch(markAllAsRead()),
    markAllAsViewed: () => dispatch(markAllAsViewed()),
    unsubscribeUser: (userId: ID) => dispatch(unsubscribeUser(userId)),
    toggleNotificationPanel: () => dispatch(toggleNotificationPanel()),
    fetchNotifications: (limit?: number) => dispatch(fetchNotifications(limit)),
    setNotificationModal: (open: boolean, notificationId?: string) =>
      dispatch(setNotificationModal(open, notificationId))
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(NotificationPanel)
