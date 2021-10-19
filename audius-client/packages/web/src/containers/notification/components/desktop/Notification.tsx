import React, { MutableRefObject } from 'react'

import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ID } from 'common/models/Identifiers'
import { Nullable } from 'common/utils/typeUtils'
import ErrorWrapper from 'components/general/ErrorWrapper'
import { OwnProps as NotificationMenuProps } from 'containers/menu/NotificationMenu'
import {
  getNotificationUser,
  getNotificationUsers,
  getNotificationEntity,
  getNotificationEntities
} from 'containers/notification/store/selectors'
import { NotificationType } from 'containers/notification/store/types'
import { AppState } from 'store/types'

import Announcement from './Announcement'
import NotificationBlock, { USER_LENGTH_LIMIT } from './NotificationBlock'

type OwnProps = {
  notification: any
  overflowMenuRef: MutableRefObject<Nullable<HTMLDivElement>>
  userListModalRef: MutableRefObject<Nullable<HTMLDivElement>>
  panelRef: MutableRefObject<Nullable<HTMLDivElement>>
  scrollRef: MutableRefObject<Nullable<HTMLDivElement>>
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
        goToRoute={props.goToRoute}
        markAsRead={props.markAsRead}
        menuProps={menuProps}
        notification={notification}
        overflowMenuRef={props.overflowMenuRef}
        userListModalRef={props.userListModalRef}
        setNotificationUsers={props.setNotificationUsers}
        timeLabel={timeLabel}
        toggleNotificationPanel={props.toggleNotificationPanel}
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
