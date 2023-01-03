import { useCallback } from 'react'

import { Image, Platform } from 'react-native'

import audiusLogoHorizontal from 'app/assets/images/Horizontal-Logo-Full-Color.png'
import Bell from 'app/assets/images/emojis/bell.png'
import Headphone from 'app/assets/images/emojis/headphone.png'
import SpeechBalloon from 'app/assets/images/emojis/speech-balloon.png'
import Trophy from 'app/assets/images/emojis/trophy.png'
import IconSettings from 'app/assets/images/iconSettings.svg'
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
  audioRewards: '$AUDIO & Rewards',
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

const IconProps = { height: 28, width: 28, style: { marginRight: 4 } }

export const SettingsScreen = () => {
  const styles = useStyles()

  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePressRewards = useCallback(() => {
    navigation.push('AudioScreen')
  }, [navigation])

  const handlePressHistory = useCallback(() => {
    navigation.push('ListeningHistoryScreen')
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
      <ScrollView>
        <Image source={audiusLogoHorizontal} style={styles.logo} />
        <AccountSettingsRow />
        <SettingsRow onPress={handlePressRewards}>
          <SettingsRowLabel label={messages.audioRewards} iconSource={Trophy} />
        </SettingsRow>
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
