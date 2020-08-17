import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { Dispatch } from 'redux'
import { getBrowserNotificationSettings } from 'containers/settings-page/store/selectors'
import { NotificationType } from 'containers/notification/store/types'

import CascadingMenu from 'components/navigation/CascadingMenu'
import { AppState } from 'store/types'

export type OwnProps = {
  type: 'notification'
  notificationId: string
  notificationType: NotificationType
  children?: JSX.Element
  mount?: string
  onHide: (notificationId: string) => void
  onToggleNotification?: () => void
  mountRef: JSX.Element
  scrollRef: JSX.Element
}

export type NotificationMenuProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const NotificationMenu = (props: NotificationMenuProps) => {
  const { onHide, notificationId } = props
  const onHideNotification = useCallback(() => {
    onHide(notificationId)
  }, [onHide, notificationId])

  const getMenu = () => {
    const menu: { items: object[] } = {
      items: [
        {
          text: 'Hide this notification',
          onClick: onHideNotification
        }
      ]
    }
    return menu
  }

  const NotificationMenu = getMenu()
  const { mountRef } = props
  const getContainer = useCallback(() => (mountRef as any).current, [mountRef])
  return (
    <CascadingMenu
      getContainer={getContainer}
      scrollRef={props.scrollRef}
      autoAdjustOverflow={false}
      menu={NotificationMenu}
      mount={props.mount}
    >
      {props.children}
    </CascadingMenu>
  )
}

function mapStateToProps(store: AppState) {
  return {
    notificationSettings: getBrowserNotificationSettings(store)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

NotificationMenu.defaultProps = {
  mount: 'page'
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationMenu)
