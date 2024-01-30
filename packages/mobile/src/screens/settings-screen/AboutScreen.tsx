import { COPYRIGHT_TEXT } from 'audius-client/src/utils/copyright'
import {
  AUDIUS_CAREERS_LINK,
  AUDIUS_CONTACT_EMAIL_LINK,
  AUDIUS_DISCORD_LINK,
  AUDIUS_HELP_LINK,
  AUDIUS_INSTAGRAM_LINK,
  AUDIUS_TWITTER_LINK,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE
} from 'audius-client/src/utils/route'
import { View, Image } from 'react-native'
import codePush from 'react-native-code-push'
import { useAsync } from 'react-use'

import {
  IconMessage,
  IconDiscord,
  IconInstagram,
  IconTwitter
} from '@audius/harmony-native'
import appIcon from 'app/assets/images/appIcon.png'
import IconCareers from 'app/assets/images/iconCareers.svg'
import { Screen, ScreenContent, Text } from 'app/components/core'
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
  terms: 'Terms of Service',
  privacy: 'Privacy Policy'
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

  const { value: codePushLabel } = useAsync(async () => {
    const metadata = await codePush.getUpdateMetadata()
    return metadata?.label
  })

  return (
    <Screen variant='secondary' title={messages.title} topbarRight={null}>
      <ScreenContent isOfflineCapable>
        <View style={styles.header}>
          <Image source={appIcon} style={styles.appIcon} />
          <View>
            <Text variant='h2'>{messages.appName}</Text>
            <Text variant='body2'>
              {messages.version} {appVersion}
              {!codePushLabel ? null : ` c${codePushLabel}`}
            </Text>
            <Text variant='body2'>{messages.copyright}</Text>
          </View>
        </View>
        <SettingsRow url={AUDIUS_DISCORD_LINK} firstItem>
          <SettingsRowLabel label={messages.discord} icon={IconDiscord} />
        </SettingsRow>
        <SettingsRow url={AUDIUS_TWITTER_LINK}>
          <SettingsRowLabel label={messages.twitter} icon={IconTwitter} />
        </SettingsRow>
        <SettingsRow url={AUDIUS_INSTAGRAM_LINK}>
          <SettingsRowLabel label={messages.instagram} icon={IconInstagram} />
        </SettingsRow>
        <SettingsRow url={AUDIUS_CONTACT_EMAIL_LINK}>
          <SettingsRowLabel label={messages.contact} icon={IconMessage} />
        </SettingsRow>
        <SettingsRow url={AUDIUS_CAREERS_LINK}>
          <SettingsRowLabel label={messages.careers} icon={IconCareers} />
        </SettingsRow>
        <Divider />
        <SettingsRow url={AUDIUS_HELP_LINK}>
          <SettingsRowLabel label={messages.help} />
        </SettingsRow>
        <SettingsRow url={`https://audius.co${TERMS_OF_SERVICE}`}>
          <SettingsRowLabel label={messages.terms} />
        </SettingsRow>
        <SettingsRow url={`https://audius.co${PRIVACY_POLICY}`}>
          <SettingsRowLabel label={messages.privacy} />
        </SettingsRow>
      </ScreenContent>
    </Screen>
  )
}
