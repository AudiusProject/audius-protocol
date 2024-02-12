import { FeatureFlags } from '@audius/common/services'
import {
  settingsPageActions,
  PushNotificationSetting
} from '@audius/common/store'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { Screen, ScreenContent } from 'app/components/core'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

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
  remixes: 'Remixes of My Tracks',
  messages: 'Messages'
}

export const NotificationSettingsScreen = () => {
  const dispatch = useDispatch()
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)

  useEffectOnce(() => {
    dispatch(getPushNotificationSettings())
    dispatch(getNotificationSettings())
  })

  return (
    <Screen title={messages.title} variant='secondary' topbarRight={null}>
      <ScreenContent>
        <Divider />
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
        {isChatEnabled ? (
          <NotificationRow
            label={messages.messages}
            type={PushNotificationSetting.Messages}
          />
        ) : null}
        <Divider />
        <EmailFrequencyControlRow />
      </ScreenContent>
    </Screen>
  )
}
