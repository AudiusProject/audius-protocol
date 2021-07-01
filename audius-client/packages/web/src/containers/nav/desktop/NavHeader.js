import React, { useCallback } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as AudiusLogoHorizontal } from 'assets/img/audiusLogoHorizontal.svg'
import { ReactComponent as IconNotification } from 'assets/img/iconNotification.svg'
import NavButton from 'containers/nav/desktop/NavButton'
import NavIconPopover from 'containers/nav/desktop/NavIconPopover'
import NotificationPanel from 'containers/notification/NotificationPanel'
import { useRemoteVar } from 'containers/remote-config/hooks'
import Theme from 'models/Theme'
import { StringKeys } from 'services/remote-config'
import { formatCount } from 'utils/formatUtil'
import { HOME_PAGE, BASE_URL, stripBaseUrl } from 'utils/route'
import { getTheme } from 'utils/theme/theme'

import styles from './NavHeader.module.css'

const NavHeader = ({
  account,
  notificationCount,
  notificationPanelIsOpen,
  toggleNotificationPanel,
  goToRoute,
  isElectron
}) => {
  const logoVariant = useRemoteVar(StringKeys.AUDIUS_LOGO_VARIANT)
  const logoVariantClickTarget = useRemoteVar(
    StringKeys.AUDIUS_LOGO_VARIANT_CLICK_TARGET
  )
  const isMatrix = getTheme() === Theme.MATRIX

  const onClickLogo = useCallback(() => {
    if (logoVariantClickTarget) {
      if (logoVariantClickTarget.startsWith(BASE_URL)) {
        goToRoute(stripBaseUrl(logoVariantClickTarget))
      } else {
        const win = window.open(logoVariantClickTarget, '_blank')
        if (win) win.focus()
      }
    } else {
      goToRoute(HOME_PAGE)
    }
  }, [logoVariantClickTarget, goToRoute])

  return (
    <div className={styles.header}>
      <div className={styles.logoWrapper} onClick={onClickLogo}>
        {logoVariant ? (
          <img src={logoVariant} alt='' />
        ) : (
          <AudiusLogoHorizontal
            className={cn(styles.logo, { [styles.matrixLogo]: isMatrix })}
          />
        )}
      </div>
      {account ? (
        <div className={styles.headerIconContainer}>
          <NavIconPopover />
          <div
            onClick={toggleNotificationPanel}
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
          <NotificationPanel
            isElectron={isElectron}
            toggleNotificationPanel={toggleNotificationPanel}
          />
        </div>
      ) : null}
    </div>
  )
}

NavButton.propTypes = {
  account: PropTypes.object,
  notificationCount: PropTypes.number,
  notificationPanelIsOpen: PropTypes.bool,
  toggleNotificationPanel: PropTypes.func,
  isElectron: PropTypes.bool,
  goToRoute: PropTypes.func,
  pendingClaim: PropTypes.bool
}

export default NavHeader
