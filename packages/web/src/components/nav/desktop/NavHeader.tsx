import { useCallback, useRef } from 'react'

import {
  Theme,
  StringKeys,
  FeatureFlags,
  formatCount,
  accountSelectors,
  notificationsSelectors,
  Name,
  themeSelectors
} from '@audius/common'
import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as AudiusLogoHorizontal } from 'assets/img/audiusLogoHorizontal.svg'
import { ReactComponent as IconNotification } from 'assets/img/iconNotification.svg'
import { make, useRecord } from 'common/store/analytics/actions'
import NavPopupMenu from 'components/nav/desktop/NavPopupMenu'
import { NotificationPanel } from 'components/notification'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { getNotificationPanelIsOpen } from 'store/application/ui/notifications/notificationsUISelectors'
import {
  closeNotificationPanel,
  openNotificationPanel
} from 'store/application/ui/notifications/notificationsUISlice'
import { AppState } from 'store/types'
import { HOME_PAGE, BASE_URL, stripBaseUrl } from 'utils/route'

import styles from './NavHeader.module.css'

const { getAccountUser } = accountSelectors
const { getNotificationUnviewedCount } = notificationsSelectors
const { getTheme } = themeSelectors

const messages = {
  earlyAccess: 'Early Access'
}

export const NavHeader = () => {
  const dispatch = useDispatch()
  const record = useRecord()
  const account = useSelector(getAccountUser)
  const notificationCount = useSelector(getNotificationUnviewedCount)

  const notificationPanelIsOpen = useSelector(getNotificationPanelIsOpen)
  const notificationPanelAnchorRef = useRef<HTMLDivElement>(null)
  const logoVariant = useRemoteVar(StringKeys.AUDIUS_LOGO_VARIANT)
  const logoVariantClickTarget = useRemoteVar(
    StringKeys.AUDIUS_LOGO_VARIANT_CLICK_TARGET
  )

  const isMatrix = useSelector(
    (state: AppState) => getTheme(state) === Theme.MATRIX
  )

  const handleToggleNotificationPanel = useCallback(() => {
    if (!notificationPanelIsOpen) {
      dispatch(openNotificationPanel())
      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
    } else {
      dispatch(closeNotificationPanel())
    }
  }, [notificationPanelIsOpen, dispatch, record])

  const handleClickLogo = useCallback(() => {
    if (logoVariantClickTarget) {
      if (logoVariantClickTarget.startsWith(BASE_URL)) {
        dispatch(push(stripBaseUrl(logoVariantClickTarget)))
      } else {
        const win = window.open(logoVariantClickTarget, '_blank')
        if (win) win.focus()
      }
    } else {
      dispatch(push(HOME_PAGE))
    }
  }, [logoVariantClickTarget, dispatch])

  const { isEnabled: isEarlyAccess } = useFlag(FeatureFlags.EARLY_ACCESS)

  return (
    <div className={styles.header}>
      <div className={styles.logoWrapper} onClick={handleClickLogo}>
        {logoVariant ? (
          <img src={logoVariant} alt='' />
        ) : (
          <AudiusLogoHorizontal
            className={cn(styles.logo, { [styles.matrixLogo]: isMatrix })}
          />
        )}
      </div>
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
