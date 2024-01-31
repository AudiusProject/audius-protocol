import {
  IconMessage as IconContact,
  IconUserGroup as IconCareers,
  IconDiscord,
  IconInstagram,
  IconTwitter
} from '@audius/harmony'

import appIcon from 'assets/img/appIcon.png'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import Page from 'components/page/Page'
import { COPYRIGHT_TEXT } from 'utils/copyright'
import {
  AUDIUS_CAREERS_LINK,
  AUDIUS_CONTACT_EMAIL_LINK,
  AUDIUS_DISCORD_LINK,
  AUDIUS_HELP_LINK,
  AUDIUS_INSTAGRAM_LINK,
  AUDIUS_TWITTER_LINK,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE
} from 'utils/route'

import packageInfo from '../../../../../package.json'

import styles from './AboutSettingsPage.module.css'
import settingsPageStyles from './SettingsPage.module.css'

const { version: appVersion } = packageInfo

const messages = {
  heading: 'About',
  discord: 'Join our community on Discord',
  twitter: 'Follow us on Twitter',
  instagram: 'Follow us on Instagram',
  contact: 'Contact Us',
  careers: 'Careers at Audius',
  help: 'Help / FAQ',
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  title: 'Audius Music',
  version: 'Audius Version',
  copyright: COPYRIGHT_TEXT
}

const AboutSettingsPage = () => {
  return (
    <Page
      title={messages.heading}
      contentClassName={settingsPageStyles.pageContent}
      containerClassName={settingsPageStyles.page}
    >
      <div className={settingsPageStyles.bodyContainer}>
        <div className={styles.header}>
          <img src={appIcon} alt='Audius' />
          <div className={styles.info}>
            <div className={styles.title}>{messages.title}</div>
            <div className={styles.versionInfo}>
              <div>{`${messages.version} ${appVersion}`}</div>
              <div>{messages.copyright}</div>
            </div>
          </div>
        </div>
        <GroupableList>
          <Grouping>
            <Row
              prefix={<IconDiscord className={styles.icon} />}
              title={messages.discord}
              href={AUDIUS_DISCORD_LINK}
            />
            <Row
              prefix={<IconTwitter className={styles.icon} />}
              title={messages.twitter}
              href={AUDIUS_TWITTER_LINK}
            />
            <Row
              prefix={<IconInstagram className={styles.icon} />}
              title={messages.instagram}
              href={AUDIUS_INSTAGRAM_LINK}
            />
            <Row
              prefix={<IconContact className={styles.icon} />}
              title={messages.contact}
              href={AUDIUS_CONTACT_EMAIL_LINK}
            />
            <Row
              prefix={<IconCareers className={styles.icon} />}
              title={messages.careers}
              href={AUDIUS_CAREERS_LINK}
            />
          </Grouping>
          <Grouping>
            <Row title={messages.help} href={AUDIUS_HELP_LINK} />
            <Row
              title={messages.terms}
              to={TERMS_OF_SERVICE}
              target='_blank'
              rel='noreferrer'
            />
            <Row
              title={messages.privacy}
              to={PRIVACY_POLICY}
              target='_blank'
              rel='noreferrer'
            />
          </Grouping>
        </GroupableList>
      </div>
    </Page>
  )
}

export default AboutSettingsPage
