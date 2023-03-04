import { useCallback, useEffect, useState } from 'react'

import { COPYRIGHT_TEXT } from 'audius-client/src/utils/copyright'
import { View, Image, TouchableWithoutFeedback } from 'react-native'
import codePush from 'react-native-code-push'

import appIcon from 'app/assets/images/appIcon.png'
import IconCareers from 'app/assets/images/iconCareers.svg'
import IconContact from 'app/assets/images/iconContact.svg'
import IconDiscord from 'app/assets/images/iconDiscord.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTwitter from 'app/assets/images/iconTwitterBird.svg'
import { Screen, ScreenContent, Text } from 'app/components/core'
import { toggleLocalOfflineModeOverride } from 'app/hooks/useIsOfflineModeEnabled'
import { makeStyles } from 'app/styles'

import packageInfo from '../../../package.json'

import { Divider } from './Divider'
import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'

const { version: appVersion } = packageInfo

const messages = {
  title: 'About',
  appName: 'Audius Music',
  version: 'Audius Version',
  copyright: COPYRIGHT_TEXT,
  discord: 'Join our community on Discord',
  twitter: 'Follow us on Twitter',
  instagram: 'Follow us on Instagram',
  contact: 'Contact Us',
  careers: 'Careers at Audius',
  help: 'Help / FAQ',
  terms: 'Terms & Privacy Policy'
}

const useStyles = makeStyles(({ spacing }) => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(6)
  },
  appIcon: {
    height: 84,
    width: 84,
    marginRight: spacing(4)
  }
}))

export const AboutScreen = () => {
  const styles = useStyles()
  const [clickCount, setClickCount] = useState(0)
  const [codepushUpdateNumber, setCodepushUpdateNumber] = useState<
    string | null
  >(null)
  const handleTitleClick = useCallback(() => {
    if (clickCount >= 19) {
      toggleLocalOfflineModeOverride()
      setClickCount(0)
    } else {
      setClickCount(clickCount + 1)
    }
  }, [clickCount])
  useEffect(() => {
    codePush.getUpdateMetadata().then((res) => {
      if (res) {
        setCodepushUpdateNumber(res?.label)
      }
    })
  }, [])

  return (
    <Screen variant='secondary' title={messages.title} topbarRight={null}>
      <ScreenContent isOfflineCapable>
        <View style={styles.header}>
          <Image source={appIcon} style={styles.appIcon} />
          <View>
            <TouchableWithoutFeedback onPress={handleTitleClick}>
              <Text variant='h2'>{messages.appName}</Text>
            </TouchableWithoutFeedback>
            <Text variant='body2'>
              {messages.version} {appVersion}
              {codepushUpdateNumber == null
                ? null
                : ` c${codepushUpdateNumber}`}
            </Text>
            <Text variant='body2'>{messages.copyright}</Text>
          </View>
        </View>
        <SettingsRow url='https://discordapp.com/invite/yNUg2e2' firstItem>
          <SettingsRowLabel label={messages.discord} icon={IconDiscord} />
        </SettingsRow>
        <SettingsRow url='https://twitter.com/AudiusProject'>
          <SettingsRowLabel label={messages.twitter} icon={IconTwitter} />
        </SettingsRow>
        <SettingsRow url='https://www.instagram.com/audiusmusic/'>
          <SettingsRowLabel label={messages.instagram} icon={IconInstagram} />
        </SettingsRow>
        <SettingsRow url='mailto:contact@audius.co'>
          <SettingsRowLabel label={messages.contact} icon={IconContact} />
        </SettingsRow>
        <SettingsRow url='https://jobs.lever.co/audius'>
          <SettingsRowLabel label={messages.careers} icon={IconCareers} />
        </SettingsRow>
        <Divider />
        <SettingsRow url='https://help.audius.co/'>
          <SettingsRowLabel label={messages.help} />
        </SettingsRow>
        <SettingsRow url='https://audius.co/legal/terms-of-use'>
          <SettingsRowLabel label={messages.terms} />
        </SettingsRow>
      </ScreenContent>
    </Screen>
  )
}
