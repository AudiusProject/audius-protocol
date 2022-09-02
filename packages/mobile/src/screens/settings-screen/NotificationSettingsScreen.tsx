import { PushNotificationSetting, settingsPageActions } from '@audius/common'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { Screen } from 'app/components/core'
import { remindUserToTurnOnNotifications } from 'app/components/notification-reminder/NotificationReminder'

import { Divider } from './Divider'
import { EmailFrequencyControlRow } from './EmailFrequencyControlRow'
import { NotificationRow } from './NotificationRow'

const { getPushNotificationSettings, getNotificationSettings } =
  settingsPageActions

const messages = {
  title: 'Notifications',
  enablePn: 'Enable Push Notifications',
  milestones: 'Milestones and Achievements',
  followers: 'New Followers',
  reposts: 'Reposts',
  favorites: 'Favorites',
  remixes: 'Remixes of My Tracks'
}

export const NotificationSettingsScreen = () => {
  const dispatch = useDispatch()

  useEffectOnce(() => {
    dispatch(getPushNotificationSettings())
    dispatch(getNotificationSettings())
    remindUserToTurnOnNotifications(dispatch)
  })

  return (
    <Screen title={messages.title} variant='secondary' topbarRight={null}>
      <NotificationRow
        label={messages.enablePn}
        type={PushNotificationSetting.MobilePush}
      />
      <NotificationRow
        label={messages.milestones}
        type={PushNotificationSetting.MilestonesAndAchievements}
      />
      <NotificationRow
        label={messages.followers}
        type={PushNotificationSetting.Followers}
      />
      <NotificationRow
        label={messages.reposts}
        type={PushNotificationSetting.Reposts}
      />
      <NotificationRow
        label={messages.favorites}
        type={PushNotificationSetting.Favorites}
      />
      <NotificationRow
        label={messages.remixes}
        type={PushNotificationSetting.Remixes}
      />
      <Divider />
      <EmailFrequencyControlRow />
    </Screen>
  )
}
