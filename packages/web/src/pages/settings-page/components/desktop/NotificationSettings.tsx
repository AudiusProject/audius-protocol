import { useCallback } from 'react'

import { FeatureFlags } from '@audius/common/services'
import {
  BrowserNotificationSetting,
  EmailFrequency,
  Notifications
} from '@audius/common/store'
import { IconClose as IconRemove } from '@audius/harmony'
import { Modal, SegmentedControl } from '@audius/stems'
import cn from 'classnames'

import Switch from 'components/switch/Switch'
import { useFlag } from 'hooks/useRemoteConfig'
import { Permission } from 'utils/browserNotifications'
import { isElectron } from 'utils/clientUtil'

import styles from './NotificationSettings.module.css'

const messages = {
  title: 'NOTIFICATIONS',
  browserPushNotifications: 'Browser Push Notifications',
  milestonesAndAchievements: 'Milestones and Achievements',
  followers: 'New Followers',
  reposts: 'Reposts',
  favorites: 'Favorites',
  remixes: 'Remixes of My Tracks',
  messages: 'Messages',
  emailFrequency: '‘What You Missed’ Email Frequency',
  enablePermissions:
    'Notifications for Audius are blocked. Please enable in your browser settings and reload the page.'
}

const ToggleNotification = ({
  text,
  isOn,
  type,
  onToggle,
  isDisabled
}: any) => {
  const handleToggle = useCallback(() => {
    onToggle(type, !isOn)
  }, [isOn, onToggle, type])
  return (
    <div
      className={cn(styles.toggleContainer, {
        [styles.isDisabled]: isDisabled
      })}
    >
      <div>{text}</div>
      <div>
        <Switch isOn={isOn} handleToggle={handleToggle} />
      </div>
    </div>
  )
}

type NotificationSettingsProps = {
  settings: Notifications
  emailFrequency: EmailFrequency
  isOpen: boolean
  toggleNotificationSetting: (
    notificationType: BrowserNotificationSetting,
    isOn: boolean
  ) => void
  toggleBrowserPushNotificationPermissions: (
    notificationType: BrowserNotificationSetting,
    isOn: boolean
  ) => void
  updateEmailFrequency: (frequency: EmailFrequency) => void
  onClose: () => void
}

const NotificationSettings = (props: NotificationSettingsProps) => {
  const { isEnabled: isChatEnabled } = useFlag(FeatureFlags.CHAT_ENABLED)
  const browserPushEnabled =
    props.settings[BrowserNotificationSetting.BrowserPush]
  const notificationToggles = [
    {
      text: messages.milestonesAndAchievements,
      isOn:
        browserPushEnabled &&
        props.settings[BrowserNotificationSetting.MilestonesAndAchievements],
      type: BrowserNotificationSetting.MilestonesAndAchievements
    },
    {
      text: messages.followers,
      isOn:
        browserPushEnabled &&
        props.settings[BrowserNotificationSetting.Followers],
      type: BrowserNotificationSetting.Followers
    },
    {
      text: messages.reposts,
      isOn:
        browserPushEnabled &&
        props.settings[BrowserNotificationSetting.Reposts],
      type: BrowserNotificationSetting.Reposts
    },
    {
      text: messages.favorites,
      isOn:
        browserPushEnabled &&
        props.settings[BrowserNotificationSetting.Favorites],
      type: BrowserNotificationSetting.Favorites
    },
    {
      text: messages.remixes,
      isOn:
        browserPushEnabled &&
        props.settings[BrowserNotificationSetting.Remixes],
      type: BrowserNotificationSetting.Remixes
    }
  ]
  if (isChatEnabled) {
    notificationToggles.push({
      text: messages.messages,
      isOn:
        browserPushEnabled &&
        props.settings[BrowserNotificationSetting.Messages],
      type: BrowserNotificationSetting.Messages
    })
  }

  const emailOptions = [
    { key: EmailFrequency.Live, text: 'Live' },
    { key: EmailFrequency.Daily, text: 'Daily' },
    { key: EmailFrequency.Weekly, text: 'Weekly' },
    { key: EmailFrequency.Off, text: 'Off' }
  ]

  const permissionDenied =
    props.settings[BrowserNotificationSetting.Permission] === Permission.DENIED

  return (
    <Modal
      isOpen={props.isOpen}
      bodyClassName={styles.bodyClassName}
      onClose={props.onClose}
      allowScroll={false}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <IconRemove className={styles.iconRemove} onClick={props.onClose} />
          <div className={styles.title}>{messages.title}</div>
        </div>
        <div className={styles.divider}></div>
        {!isElectron() && (
          <>
            <div className={styles.description}>
              <ToggleNotification
                key={'browserPushNotifications'}
                onToggle={props.toggleBrowserPushNotificationPermissions}
                text={messages.browserPushNotifications}
                isOn={browserPushEnabled}
                type={BrowserNotificationSetting.BrowserPush}
              />
              {permissionDenied && (
                <div className={styles.permissionDeniedText}>
                  {messages.enablePermissions}
                </div>
              )}
              {notificationToggles.map((notification) => (
                <ToggleNotification
                  key={notification.type}
                  onToggle={props.toggleNotificationSetting}
                  isDisabled={!browserPushEnabled}
                  {...notification}
                />
              ))}
            </div>
            <div className={styles.divider}></div>
          </>
        )}
        <div className={styles.emailContainer}>
          <div className={cn(styles.bodyText, styles.email)}>
            {messages.emailFrequency}
          </div>
          <SegmentedControl
            selected={props.emailFrequency}
            onSelectOption={props.updateEmailFrequency}
            options={emailOptions}
          />
        </div>
      </div>
    </Modal>
  )
}

export default NotificationSettings
