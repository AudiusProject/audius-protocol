import { useCallback } from 'react'

import { Image, Platform } from 'react-native'

import audiusLogoHorizontal from 'app/assets/images/Horizontal-Logo-Full-Color.png'
import IconDownload from 'app/assets/images/iconCloudDownload.svg'
import IconInfo from 'app/assets/images/iconInfo.svg'
import IconNotificationOn from 'app/assets/images/iconNotificationOn.svg'
import IconSettings from 'app/assets/images/iconSettings.svg'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { Theme } from 'app/utils/theme'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { AccountSettingsRow } from './AccountSettingsRow'
import { AppearanceSettingsRow } from './AppearanceSettingsRow'
import { CastSettingsRow } from './CastSettingsRow'
import { Divider } from './Divider'
import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'

const IS_IOS = Platform.OS === 'ios'

const messages = {
  title: 'Settings',
  downloads: 'Download Settings',
  notifications: 'Configure Notifications',
  about: 'About'
}

const useStyles = makeStyles(({ spacing, palette, type }) => ({
  logo: {
    width: '80%',
    height: 85,
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

  const navigation = useNavigation<ProfileTabScreenParamList>()

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
          {isOfflineDownloadEnabled ? (
            <SettingsRow onPress={handlePressDownloads}>
              <SettingsRowLabel
                label={messages.downloads}
                icon={IconDownload}
              />
            </SettingsRow>
          ) : null}
          <SettingsRow onPress={handlePressNotifications}>
            <SettingsRowLabel
              label={messages.notifications}
              icon={IconNotificationOn}
            />
          </SettingsRow>
          <AppearanceSettingsRow />
          {IS_IOS ? <CastSettingsRow /> : null}
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
