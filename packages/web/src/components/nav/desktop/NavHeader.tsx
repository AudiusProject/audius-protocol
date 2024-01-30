import { useCallback, useRef } from 'react'

import {
  FeatureFlags,
  formatCount,
  accountSelectors,
  notificationsSelectors,
  themeSelectors
} from '@audius/common'
import { Name, Theme } from '@audius/common/models'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import AudiusLogoHorizontal from 'assets/img/audiusLogoHorizontal.svg'
import IconNotification from 'assets/img/iconNotification.svg'
import { make, useRecord } from 'common/store/analytics/actions'
import NavPopupMenu from 'components/nav/desktop/NavPopupMenu'
import { NotificationPanel } from 'components/notification'
import { useFlag } from 'hooks/useRemoteConfig'
import { getNotificationPanelIsOpen } from 'store/application/ui/notifications/notificationsUISelectors'
import {
  closeNotificationPanel,
  openNotificationPanel
} from 'store/application/ui/notifications/notificationsUISlice'
import { useSelector } from 'utils/reducer'
import { HOME_PAGE } from 'utils/route'

import styles from './NavHeader.module.css'

const { getAccountUser } = accountSelectors
const { getNotificationUnviewedCount } = notificationsSelectors
const { getTheme } = themeSelectors

const messages = {
  earlyAccess: 'Early Access',
  homeLink: 'Go to Home'
}

export const NavHeader = () => {
  const dispatch = useDispatch()
  const record = useRecord()
  const account = useSelector(getAccountUser)
  const notificationCount = useSelector(getNotificationUnviewedCount)

  const notificationPanelIsOpen = useSelector(getNotificationPanelIsOpen)
  const notificationPanelAnchorRef = useRef<HTMLDivElement>(null)

  const isMatrix = useSelector((state) => getTheme(state) === Theme.MATRIX)

  const handleToggleNotificationPanel = useCallback(() => {
    if (!notificationPanelIsOpen) {
      dispatch(openNotificationPanel())
      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
    } else {
      dispatch(closeNotificationPanel())
    }
  }, [notificationPanelIsOpen, dispatch, record])

  const { isEnabled: isEarlyAccess } = useFlag(FeatureFlags.EARLY_ACCESS)

  return (
    <div className={styles.header}>
      <Link to={HOME_PAGE} aria-label={messages.homeLink}>
        <AudiusLogoHorizontal
          className={cn(styles.logo, { [styles.matrixLogo]: isMatrix })}
        />
      </Link>
      {isEarlyAccess ? (
        <div className={styles.earlyAccess}>{messages.earlyAccess}</div>
      ) : null}
      {account ? (
        <div className={styles.headerIconContainer}>
          <NavPopupMenu />
          <div
            ref={notificationPanelAnchorRef}
            onClick={handleToggleNotificationPanel}
            className={cn(styles.headerIconWrapper, styles.iconNotification, {
              [styles.active]: notificationCount > 0,
              [styles.notificationsOpen]: notificationPanelIsOpen
            })}
          >
            <IconNotification />
          </div>
          {notificationCount > 0 && !notificationPanelIsOpen ? (
            <div className={styles.iconTag}>
              {formatCount(notificationCount)}
            </div>
          ) : null}
          <NotificationPanel anchorRef={notificationPanelAnchorRef} />
        </div>
      ) : null}
    </div>
  )
}
