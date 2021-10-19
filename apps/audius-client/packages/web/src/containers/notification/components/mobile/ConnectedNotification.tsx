import React, { useCallback } from 'react'

import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { open } from 'common/store/ui/mobile-overflow-menu/actions'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import ErrorWrapper from 'components/general/ErrorWrapper'
import {
  getNotificationUser,
  getNotificationUsers,
  getNotificationEntity,
  getNotificationEntities
} from 'containers/notification/store/selectors'
import { NotificationType } from 'containers/notification/store/types'
import { AppState } from 'store/types'

import Announcement from './Announcement'
import Notification, { USER_LENGTH_LIMIT } from './Notification'

type OwnProps = {
  goToRoute: (route: string) => void
  setNotificationUsers: (userIds: ID[], limit: number) => void
  notification: any
  markAsRead: (notificationId: string) => void
  unsubscribeUser: (userId: ID) => void
  hideNotification: (notificationId: string) => void
}

type ConnectedNotificationProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedNotification = (props: ConnectedNotificationProps) => {
  const { markAsRead, goToRoute } = props
  const { id } = props.notification

  const goToAnnouncementPage = useCallback(() => {
    markAsRead(id)
    goToRoute(`/notification/${id}`)
  }, [id, markAsRead, goToRoute])

  if (props.notification.type === NotificationType.Announcement) {
    const onClickOverflow = (notificationId: string) => {
      props.markAsRead(props.notification.id)
      const overflowActions = [OverflowAction.HIDE_NOTIFICATION]
      props.clickOverflow(notificationId, overflowActions)
    }

    return (
      <Announcement
        {...props.notification}
        onClickOverflow={onClickOverflow}
        goToAnnouncementPage={goToAnnouncementPage}
        markAsRead={props.markAsRead}
      />
    )
  }
  const timeLabel = props.notification.timeLabel
  const notification = {
    ...props.notification,
    user: props.user,
    users: props.users,
    entity: props.entity,
    entities: props.entities
  }

  const onClickOverflow = (notificationId: string) => {
    const overflowActions = [OverflowAction.HIDE_NOTIFICATION]
    if (notification.type === NotificationType.UserSubscription) {
      overflowActions.push(OverflowAction.UNSUBSCRIBER_USER)
    }
    props.clickOverflow(notificationId, overflowActions)
  }

  return (
    <ErrorWrapper
      errorMessage={`Could not render notification ${notification.id}`}
    >
      <Notification
        timeLabel={timeLabel}
        setNotificationUsers={props.setNotificationUsers}
        goToRoute={props.goToRoute}
        markAsRead={props.markAsRead}
        notification={notification}
        onClickOverflow={onClickOverflow}
        goToUserListPage={props.goToUserListPage}
      />
    </ErrorWrapper>
  )
}

function mapStateToProps(state: AppState, props: OwnProps) {
  return {
    goToUserListPage: (notificationId: string) =>
      props.goToRoute(`/notification/${notificationId}/users`),
    user: getNotificationUser(state, props.notification),
    users: getNotificationUsers(state, props.notification, USER_LENGTH_LIMIT),
    entity: getNotificationEntity(state, props.notification),
    entities: getNotificationEntities(state, props.notification)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    clickOverflow: (
      notificationId: string,
      overflowActions: OverflowAction[]
    ) =>
      dispatch(
        open(OverflowSource.NOTIFICATIONS, notificationId, overflowActions)
      )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedNotification)
