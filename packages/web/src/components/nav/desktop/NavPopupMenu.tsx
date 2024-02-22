import { useAccountHasClaimableRewards } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import { chatSelectors } from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import {
  IconKebabHorizontal,
  IconCrown,
  IconDashboard,
  IconMessage,
  IconSettings,
  IconDonate,
  PopupMenu,
  PopupMenuItem
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { AudioBalancePill } from 'components/audio-balance-pill/AUDIOBalancePill'
import { NotificationDot } from 'components/notification-dot'
import { USDCBalancePill } from 'components/usdc-balance-pill/USDCBalancePill'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import {
  AUDIO_PAGE,
  CHATS_PAGE,
  DASHBOARD_PAGE,
  PAYMENTS_PAGE,
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
  const messagesItem = isChatEnabled
    ? {
        className: styles.item,
        text: messages.messages,
        onClick: () => {
          navigate(CHATS_PAGE)
          dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'navmenu' }))
        },
        icon: messagesIcon,
        iconClassName: styles.menuItemIcon
      }
    : null

  const payAndEarnItem = isUSDCEnabled
    ? {
        className: styles.item,
        text: (
          <div className={styles.popupItemText}>
            <span>{messages.payAndEarn}</span>
            <USDCBalancePill className={styles.usdcPill} />
          </div>
        ),
        onClick: () => navigate(PAYMENTS_PAGE),
        icon: <IconDonate size='s' />,
        iconClassName: styles.payAndEarnIcon
      }
    : null

  const dashboardItem = {
    className: styles.item,
    text: messages.dashboard,
    onClick: () => navigate(DASHBOARD_PAGE),
    icon: <IconDashboard />,
    iconClassName: styles.menuItemIcon
  }

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
  const rewardsItem = {
    className: styles.item,
    text: (
      <div className={styles.popupItemText}>
        <span>{messages.rewards}</span>
        <AudioBalancePill className={styles.audioPill} />
      </div>
    ),
    onClick: () => navigate(AUDIO_PAGE),
    icon: rewardsIcon,
    iconClassName: cn(styles.menuItemIcon, styles.crownIcon)
  }

  const settingsItem = {
    className: styles.item,
    text: messages.settings,
    onClick: () => navigate(SETTINGS_PAGE),
    icon: <IconSettings />,
    iconClassName: styles.menuItemIcon
  }

  const menuItems: PopupMenuItem[] = [
    messagesItem,
    payAndEarnItem,
    dashboardItem,
    rewardsItem,
    settingsItem
  ].filter(removeNullable)

  return (
    <div className={styles.headerIconWrapper}>
      <PopupMenu
        items={menuItems}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        className={styles.popupMenu}
        renderTrigger={(anchorRef, triggerPopup) => {
          return (
            <div className={styles.container}>
              <div
                className={styles.icon}
                ref={anchorRef}
                onClick={() => triggerPopup()}
              >
                <IconKebabHorizontal size='s' />
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
