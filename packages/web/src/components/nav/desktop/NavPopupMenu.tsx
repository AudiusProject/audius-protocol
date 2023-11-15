import {
  removeNullable,
  FeatureFlags,
  chatSelectors,
  Name,
  useAccountHasClaimableRewards,
  StringKeys
} from '@audius/common'
import {
  IconCrown,
  IconDashboard,
  IconMessage,
  IconSettings,
  IconDonate,
  PopupMenu,
  PopupMenuItem,
  PopupPosition
} from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import IconKebabHorizontal from 'assets/img/iconKebabHorizontalAlt.svg'
import { make } from 'common/store/analytics/actions'
import { Icon } from 'components/Icon'
import { NotificationDot } from 'components/notification-dot'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import {
  AUDIO_PAGE,
  CHATS_PAGE,
  DASHBOARD_PAGE,
  PAY_AND_EARN_PAGE,
  SETTINGS_PAGE
} from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './NavPopupMenu.module.css'

const messages = {
  settings: 'Settings',
  dashboard: 'Artist Dashboard',
  payAndEarn: 'Pay & Earn',
  rewards: 'Rewards',
  messages: 'Messages'
}

const NavPopupMenu = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const hasUnreadMessages = useSelector(chatSelectors.getHasUnreadMessages)
  const { isEnabled: isChatEnabled } = useFlag(FeatureFlags.CHAT_ENABLED)
  const isUSDCEnabled = useIsUSDCEnabled()
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const showNotificationBubble = hasUnreadMessages || hasClaimableRewards

  const messagesItemText = hasUnreadMessages ? (
    <div className={styles.popupItemText}>
      {messages.messages}
      <NotificationDot variant='large' />
    </div>
  ) : (
    messages.messages
  )

  const messagesIcon = hasUnreadMessages ? (
    <div>
      <IconMessage />
      <NotificationDot
        variant='large'
        className={styles.innerNotificationDot}
      />
    </div>
  ) : (
    <IconMessage />
  )

  const rewardsIcon = hasClaimableRewards ? (
    <div>
      <IconCrown />
      <NotificationDot
        variant='large'
        className={styles.innerNotificationDot}
      />
    </div>
  ) : (
    <IconCrown />
  )

  const menuItems: PopupMenuItem[] = [
    isChatEnabled
      ? {
          className: styles.item,
          text: messagesItemText,
          onClick: () => {
            navigate(CHATS_PAGE)
            dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'navmenu' }))
          },
          icon: messagesIcon,
          iconClassName: styles.menuItemIcon
        }
      : null,
    isUSDCEnabled
      ? {
          className: styles.item,
          text: messages.payAndEarn,
          onClick: () => navigate(PAY_AND_EARN_PAGE),
          icon: <Icon icon={IconDonate} />
        }
      : null,
    {
      className: styles.item,
      text: messages.dashboard,
      onClick: () => navigate(DASHBOARD_PAGE),
      icon: <IconDashboard />,
      iconClassName: styles.menuItemIcon
    },
    {
      className: styles.item,
      text: messages.rewards,
      onClick: () => navigate(AUDIO_PAGE),
      icon: rewardsIcon,
      iconClassName: cn(styles.menuItemIcon, styles.crownIcon)
    },
    {
      className: styles.item,
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
              {showNotificationBubble ? (
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
