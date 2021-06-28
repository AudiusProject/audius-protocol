import React from 'react'
import { connect } from 'react-redux'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'

import { OwnProps as NotificationMenuProps } from 'containers/menu/NotificationMenu'

import { NotificationType } from 'containers/notification/store/types'
import {
  getNotificationUser,
  getNotificationUsers,
  getNotificationEntity,
  getNotificationEntities
} from 'containers/notification/store/selectors'

import { ID } from 'models/common/Identifiers'

import NotificationBlock, { USER_LENGTH_LIMIT } from './NotificationBlock'
import Announcement from './Announcement'
import ErrorWrapper from 'components/general/ErrorWrapper'
type OwnProps = {
  notification: any
  panelRef: any
  scrollRef: any
  toggleNotificationPanel: () => void
  goToRoute: (route: string) => void
  markAsRead: (notificationId: string) => void
  unsubscribeUser: (userId: ID) => void
  setNotificationModal: (open: boolean, notificationId?: string) => void
  setNotificationUsers: (userIds: ID[], limit: number) => void
  hideNotification: (notificationId: string) => void
}

type NotificationItemProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const NotificationItem = (props: NotificationItemProps) => {
  if (props.notification.type === NotificationType.Announcement) {
    const menuProps: Omit<NotificationMenuProps, 'children'> = {
      type: 'notification',
      notificationId: props.notification.id,
      notificationType: props.notification.type,
      onHide: props.hideNotification
    }
    return (
      <Announcement
        {...props.notification}
        menuProps={menuProps}
        setNotificationModal={props.setNotificationModal}
        markAsRead={props.markAsRead}
      />
    )
  }
  const timeLabel = props.notification.timeLabel
  const menuProps: Omit<NotificationMenuProps, 'children'> = {
    type: 'notification',
    notificationId: props.notification.id,
    notificationType: props.notification.type,
    onHide: props.hideNotification
  }
  const notification = {
    ...props.notification,
    user: props.user,
    users: props.users,
    entity: props.entity,
    entities: props.entities
  }

  return (
    <ErrorWrapper
      errorMessage={`Could not render notification ${notification.id}`}
    >
      <NotificationBlock
        timeLabel={timeLabel}
        setNotificationUsers={props.setNotificationUsers}
        toggleNotificationPanel={props.toggleNotificationPanel}
        goToRoute={props.goToRoute}
        markAsRead={props.markAsRead}
        notification={notification}
        menuProps={menuProps}
      />
    </ErrorWrapper>
  )
}

function mapStateToProps(state: AppState, props: OwnProps) {
  return {
    user: getNotificationUser(state, props.notification),
    users: getNotificationUsers(state, props.notification, USER_LENGTH_LIMIT),
    entity: getNotificationEntity(state, props.notification),
    entities: getNotificationEntities(state, props.notification)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationItem)
