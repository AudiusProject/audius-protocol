import { useCallback } from 'react'

import { Image } from 'react-native'

import audiusLogoHorizontal from 'app/assets/images/Horizontal-Logo-Full-Color.png'
import Bell from 'app/assets/images/emojis/bell.png'
import Headphone from 'app/assets/images/emojis/headphone.png'
import SpeechBalloon from 'app/assets/images/emojis/speech-balloon.png'
import { Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { AccountSettingsRow } from './AccountSettingsRow'
import { AppearanceSettingsRow } from './AppearanceSettingsRow'
import { Divider } from './Divider'
import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'

const messages = {
  title: 'Settings',
  listeningHistory: 'Listening History',
  notifications: 'Notifications',
  about: 'About'
}

const useStyles = makeStyles(({ spacing }) => ({
  logo: {
    width: '80%',
    height: 85,
    marginVertical: spacing(6),
    alignSelf: 'center'
  }
}))

export const SettingsScreen = () => {
  const styles = useStyles()

  const navigation = useNavigation()

  const handlePressAbout = useCallback(() => {
    navigation.push({
      native: { screen: 'AboutScreen', params: undefined },
      web: { route: '/settings/about' }
    })
  }, [navigation])

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <Image source={audiusLogoHorizontal} style={styles.logo} />
      <AccountSettingsRow />
      <SettingsRow onPress={() => null}>
        <SettingsRowLabel
          label={messages.listeningHistory}
          iconSource={Headphone}
        />
      </SettingsRow>
      <Divider />
      <SettingsRow onPress={() => null}>
        <SettingsRowLabel label={messages.notifications} iconSource={Bell} />
      </SettingsRow>
      <AppearanceSettingsRow />
      <Divider />
      <SettingsRow onPress={handlePressAbout}>
        <SettingsRowLabel label={messages.about} iconSource={SpeechBalloon} />
      </SettingsRow>
    </Screen>
  )
}
