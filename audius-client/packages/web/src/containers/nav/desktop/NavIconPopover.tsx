import { IconCrown, IconDashboard, IconSettings } from '@audius/stems'
import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontalAlt.svg'
import IconPopup from 'components/general/IconPopup'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import React from 'react'
import { getAccountIsCreator } from 'store/account/selectors'
import { useSelector } from 'utils/reducer'
import { AUDIO_PAGE, DASHBOARD_PAGE, SETTINGS_PAGE } from 'utils/route'
import { removeNullable } from 'utils/typeUtils'
import styles from './NavIconPopover.module.css'

const messages = {
  settings: 'Settings',
  dashboard: 'Artist Dashboard',
  audio: '$AUDIO & Rewards'
}

const useIsCreator = () => {
  return useSelector(getAccountIsCreator)
}

const NavIconPopover = () => {
  const navigate = useNavigateToPage()
  const isCreator = useIsCreator()

  const menuItems = [
    {
      text: messages.settings,
      onClick: () => navigate(SETTINGS_PAGE),
      icon: <IconSettings />
    },
    isCreator
      ? {
          text: messages.dashboard,
          onClick: () => navigate(DASHBOARD_PAGE),
          icon: <IconDashboard />
        }
      : null,
    {
      text: messages.audio,
      onClick: () => navigate(AUDIO_PAGE),
      className: styles.rewardsMenu,
      menuIconClassName: styles.crownIcon,
      icon: <IconCrown />
    }
  ].filter(removeNullable)

  return (
    <div className={styles.headerIconWrapper}>
      <IconPopup
        menu={{ items: menuItems }}
        icon={<IconKebabHorizontal />}
        popupClassName={styles.scalingWrapper}
        iconClassName={styles.iconClass}
        menuClassName={styles.menu}
        menuIconClassName={styles.menuIcon}
        position='bottomRight'
      />
    </div>
  )
}

export default NavIconPopover
