import appIcon from 'assets/img/appIcon.png'
import { ReactComponent as IconCareers } from 'assets/img/iconCareers.svg'
import { ReactComponent as IconContact } from 'assets/img/iconContact.svg'
import { ReactComponent as IconDiscord } from 'assets/img/iconDiscord.svg'
import { ReactComponent as IconInstagram } from 'assets/img/iconInstagram.svg'
import { ReactComponent as IconTwitter } from 'assets/img/iconTwitterBird.svg'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import Page from 'components/page/Page'
import { COPYRIGHT_TEXT } from 'utils/copyright'

import packageInfo from '../../../../../package.json'

import styles from './AboutSettingsPage.module.css'
import { SettingsPageProps } from './SettingsPage'
import settingsPageStyles from './SettingsPage.module.css'

const { version: appVersion } = packageInfo

const links = {
  discord: 'https://discordapp.com/invite/yNUg2e2',
  instagram: 'https://www.instagram.com/audiusmusic/',
  twitter: 'https://twitter.com/AudiusProject',
  contact: 'mailto:contact@audius.co',
  careers: 'https://jobs.lever.co/audius',
  help: 'https://help.audius.co/',
  terms: 'https://audius.co/legal/terms-of-use'
}

const messages = {
  discord: 'Join our community on Discord',
  twitter: 'Follow us on Twitter',
  instagram: 'Follow us on Instagram',
  contact: 'Contact Us',
  careers: 'Careers at Audius',
  help: 'Help / FAQ',
  terms: 'Terms & Privacy Policy',

  title: 'Audius Music',
  version: 'Audius Version',
  copyright: COPYRIGHT_TEXT
}

const AboutSettingsPage = (props: SettingsPageProps) => {
  const openLink = (link: string) => {
    window.open(link, '_blank')
  }

  return (
    <Page
      title='About'
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
              onClick={() => openLink(links.discord)}
            />
            <Row
              prefix={<IconTwitter className={styles.icon} />}
              title={messages.twitter}
              onClick={() => openLink(links.twitter)}
            />
            <Row
              prefix={<IconInstagram className={styles.icon} />}
              title={messages.instagram}
              onClick={() => openLink(links.instagram)}
            />
            <Row
              prefix={<IconContact className={styles.icon} />}
              title={messages.contact}
              onClick={() => openLink(links.contact)}
            />
            <Row
              prefix={<IconCareers className={styles.icon} />}
              title={messages.careers}
              onClick={() => openLink(links.careers)}
            />
          </Grouping>
          <Grouping>
            <Row title={messages.help} onClick={() => openLink(links.help)} />
            <Row title={messages.terms} onClick={() => openLink(links.terms)} />
          </Grouping>
        </GroupableList>
      </div>
    </Page>
  )
}

export default AboutSettingsPage
