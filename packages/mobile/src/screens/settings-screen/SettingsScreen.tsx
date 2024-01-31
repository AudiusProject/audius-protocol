import { useCallback } from 'react'

import { FeatureFlags } from '@audius/common/services'
import { Image, Platform } from 'react-native'

import audiusLogoHorizontal from 'app/assets/images/Horizontal-Logo-Full-Color.png'
import IconDownload from 'app/assets/images/iconCloudDownload.svg'
import IconInfo from 'app/assets/images/iconInfo.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import IconNotificationOn from 'app/assets/images/iconNotificationOn.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { Theme } from 'app/utils/theme'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { AccountSettingsRow } from './AccountSettingsRow'
import { AppearanceSettingsRow } from './AppearanceSettingsRow'
import { CastSettingsRow } from './CastSettingsRow'
import { Divider } from './Divider'
import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowDescription } from './SettingsRowDescription'

const IS_IOS = Platform.OS === 'ios'

const messages = {
  title: 'Settings',
  inbox: 'Inbox Settings',
  inboxDescription: 'Configure who is able to send messages to your inbox.',
  notifications: 'Configure Notifications',
  notificationsDescription: 'Review your notification preferences.',
  downloads: 'Download Settings',
  about: 'About'
}

const useStyles = makeStyles(({ spacing, palette, type }) => ({
  logo: {
    width: 200,
    height: 48,
    marginVertical: spacing(6),
    alignSelf: 'center',
    resizeMode: 'contain',
    tintColor: type === Theme.DEFAULT ? undefined : palette.staticWhite
  }
}))

const IconProps = { height: 28, width: 28, style: { marginRight: 4 } }

export const SettingsScreen = () => {
  const styles = useStyles()
  const isOfflineDownloadEnabled = useIsOfflineModeEnabled()
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)

  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePressInbox = useCallback(() => {
    navigation.push('InboxSettingsScreen')
  }, [navigation])

  const handlePressDownloads = useCallback(() => {
    navigation.push('DownloadSettingsScreen')
  }, [navigation])

  const handlePressNotifications = useCallback(() => {
    navigation.push('NotificationSettingsScreen')
  }, [navigation])

  const handlePressAbout = useCallback(() => {
    navigation.push('AboutScreen')
  }, [navigation])

  return (
    <Screen
      variant='secondary'
      title={messages.title}
      icon={IconSettings}
      IconProps={IconProps}
      url='/settings'
      topbarRight={null}
    >
      <ScreenContent isOfflineCapable>
        <ScrollView>
          <Image source={audiusLogoHorizontal} style={styles.logo} />
          <AccountSettingsRow />
          <Divider />
          <AppearanceSettingsRow />
          {isChatEnabled ? (
            <SettingsRow onPress={handlePressInbox}>
              <SettingsRowLabel label={messages.inbox} icon={IconMessage} />
              <SettingsRowDescription>
                {messages.inboxDescription}
              </SettingsRowDescription>
            </SettingsRow>
          ) : null}
          <SettingsRow onPress={handlePressNotifications}>
            <SettingsRowLabel
              label={messages.notifications}
              icon={IconNotificationOn}
            />
            <SettingsRowDescription>
              {messages.notificationsDescription}
            </SettingsRowDescription>
          </SettingsRow>
          {IS_IOS ? <CastSettingsRow /> : null}
          {isOfflineDownloadEnabled ? (
            <SettingsRow onPress={handlePressDownloads}>
              <SettingsRowLabel
                label={messages.downloads}
                icon={IconDownload}
              />
            </SettingsRow>
          ) : null}
          <Divider />
          <SettingsRow onPress={handlePressAbout}>
            <SettingsRowLabel label={messages.about} icon={IconInfo} />
          </SettingsRow>
          <Divider />
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
