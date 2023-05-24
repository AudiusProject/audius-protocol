import {
  removeNullable,
  accountSelectors,
  FeatureFlags,
  chatSelectors
} from '@audius/common'
import {
  IconCrown,
  IconDashboard,
  IconMessage,
  IconSettings,
  PopupMenu,
  PopupMenuItem,
  PopupPosition
} from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontalAlt.svg'
import { Icon } from 'components/Icon'
import { NotificationDot } from 'components/notification-dot'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import {
  AUDIO_PAGE,
  CHATS_PAGE,
  DASHBOARD_PAGE,
  SETTINGS_PAGE
} from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './NavPopupMenu.module.css'
const { getAccountHasTracks } = accountSelectors

const messages = {
  settings: 'Settings',
  dashboard: 'Artist Dashboard',
  audio: '$AUDIO & Rewards',
  messages: 'Messages'
}

const useAccountHasTracks = () => {
  return useSelector(getAccountHasTracks)
}

const NavPopupMenu = () => {
  const navigate = useNavigateToPage()
  const hasTracks = useAccountHasTracks()
  const hasUnreadMessages = useSelector(chatSelectors.getHasUnreadMessages)
  const { isEnabled: isChatEnabled } = useFlag(FeatureFlags.CHAT_ENABLED)

  const messagesItemText = hasUnreadMessages ? (
    <div className={styles.popupItemText}>
      {messages.messages}
      <NotificationDot variant='large' />
    </div>
  ) : (
    messages.messages
  )

  const menuItems: PopupMenuItem[] = [
    isChatEnabled
      ? {
          text: messagesItemText,
          onClick: () => navigate(CHATS_PAGE),
          icon: <IconMessage />,
          iconClassName: styles.menuItemIcon
        }
      : null,
    {
      text: messages.settings,
      onClick: () => navigate(SETTINGS_PAGE),
      icon: <IconSettings />,
      iconClassName: styles.menuItemIcon
    },
    hasTracks
      ? {
          text: messages.dashboard,
          onClick: () => navigate(DASHBOARD_PAGE),
          icon: <IconDashboard />,
          iconClassName: styles.menuItemIcon
        }
      : null,
    {
      text: messages.audio,
      className: styles.rewardsMenuItem,
      onClick: () => navigate(AUDIO_PAGE),
      icon: <IconCrown />,
      iconClassName: cn(styles.menuItemIcon, styles.crownIcon)
    }
  ].filter(removeNullable)

  return (
    <div className={styles.headerIconWrapper}>
      <PopupMenu
        items={menuItems}
        position={PopupPosition.BOTTOM_RIGHT}
        renderTrigger={(anchorRef, triggerPopup) => {
          return (
            <div className={styles.icon} ref={anchorRef} onClick={triggerPopup}>
              <Icon
                icon={IconKebabHorizontal}
                decorator={
                  hasUnreadMessages ? (
                    <NotificationDot variant='large' />
                  ) : undefined
                }
              />
            </div>
          )
        }}
        zIndex={zIndex.NAVIGATOR_POPUP}
      />
    </div>
  )
}

export default NavPopupMenu
