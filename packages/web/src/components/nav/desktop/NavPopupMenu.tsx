import {
  removeNullable,
  accountSelectors,
  FeatureFlags,
  chatSelectors,
  Name
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
import { useDispatch } from 'react-redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontalAlt.svg'
import { make } from 'common/store/analytics/actions'
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
  const dispatch = useDispatch()
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
          onClick: () => {
            navigate(CHATS_PAGE)
            dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'navmenu' }))
          },
          icon: <IconMessage />,
          iconClassName: styles.menuItemIcon
        }
      : null,
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
    },
    {
      text: messages.settings,
      onClick: () => navigate(SETTINGS_PAGE),
      icon: <IconSettings />,
      iconClassName: styles.menuItemIcon
    }
  ].filter(removeNullable)

  return (
    <div className={styles.headerIconWrapper}>
      <PopupMenu
        items={menuItems}
        position={PopupPosition.BOTTOM_RIGHT}
        renderTrigger={(anchorRef, triggerPopup) => {
          return (
            <div className={styles.container}>
              <div
                className={styles.icon}
                ref={anchorRef}
                onClick={() => triggerPopup()}
              >
                <Icon icon={IconKebabHorizontal} />
              </div>
              {hasUnreadMessages ? (
                <NotificationDot
                  variant='large'
                  className={styles.notificationDot}
                />
              ) : undefined}
            </div>
          )
        }}
        zIndex={zIndex.NAVIGATOR_POPUP}
      />
    </div>
  )
}

export default NavPopupMenu
