import { useCallback } from 'react'

import { Image, Platform } from 'react-native'

import audiusLogoHorizontal from 'app/assets/images/Horizontal-Logo-Full-Color.png'
import Bell from 'app/assets/images/emojis/bell.png'
import Headphone from 'app/assets/images/emojis/headphone.png'
import SpeechBalloon from 'app/assets/images/emojis/speech-balloon.png'
import { Screen, ScrollView } from 'app/components/core'
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
  listeningHistory: 'Listening History',
  notifications: 'Notifications',
  about: 'About'
}

const useStyles = makeStyles(({ spacing, palette, type }) => ({
  logo: {
    width: '80%',
    height: 85,
    marginVertical: spacing(6),
    alignSelf: 'center',
    tintColor: type === Theme.DEFAULT ? undefined : palette.staticWhite
  }
}))

export const SettingsScreen = () => {
  const styles = useStyles()

  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePressHistory = useCallback(() => {
    navigation.push({
      native: { screen: 'ListeningHistoryScreen' },
      web: { route: '/history' }
    })
  }, [navigation])

  const handlePressNotifications = useCallback(() => {
    navigation.push({
      native: { screen: 'NotificationSettingsScreen' },
      web: { route: '/settings/notifications' }
    })
  }, [navigation])

  const handlePressAbout = useCallback(() => {
    navigation.push({
      native: { screen: 'AboutScreen' },
      web: { route: '/settings/about' }
    })
  }, [navigation])

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <ScrollView>
        <Image source={audiusLogoHorizontal} style={styles.logo} />
        <AccountSettingsRow />
        <SettingsRow onPress={handlePressHistory}>
          <SettingsRowLabel
            label={messages.listeningHistory}
            iconSource={Headphone}
          />
        </SettingsRow>
        <Divider />
        <SettingsRow onPress={handlePressNotifications}>
          <SettingsRowLabel label={messages.notifications} iconSource={Bell} />
        </SettingsRow>
        <AppearanceSettingsRow />
        {IS_IOS ? <CastSettingsRow /> : null}
        <Divider />
        <SettingsRow onPress={handlePressAbout}>
          <SettingsRowLabel label={messages.about} iconSource={SpeechBalloon} />
        </SettingsRow>
      </ScrollView>
    </Screen>
  )
}
