import { EmailFrequency } from '@audius/common/store'
import { SegmentedControl } from '@audius/stems'

import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import Page from 'components/page/Page'

import styles from './NotificationsSettingsPage.module.css'
import { SettingsPageProps } from './SettingsPage'
import settingsPageStyles from './SettingsPage.module.css'

const messages = {
  title: 'Notifications',
  enablePn: 'Enable Push Notifications',
  milestones: 'Milestones and Achievements',
  followers: 'New Followers',
  reposts: 'Reposts',
  favorites: 'Favorites',
  remixes: 'Remixes of My Tracks',
  emailFrequency: '‘What You Missed’ Email Frequency'
}

const emailOptions = [
  { key: EmailFrequency.Live, text: 'Live' },
  { key: EmailFrequency.Daily, text: 'Daily' },
  { key: EmailFrequency.Weekly, text: 'Weekly' },
  { key: EmailFrequency.Off, text: 'Off' }
]

const NotificationsSettingsPage = ({
  emailFrequency,
  updateEmailFrequency
}: SettingsPageProps) => {
  return (
    <Page
      title={messages.title}
      contentClassName={settingsPageStyles.pageContent}
      containerClassName={settingsPageStyles.page}
    >
      <div className={settingsPageStyles.bodyContainer}>
        <div className={styles.notificationsSettings}>
          <GroupableList>
            <Grouping>
              <Row title={messages.emailFrequency}>
                <SegmentedControl
                  isMobile
                  fullWidth
                  options={emailOptions}
                  selected={emailFrequency}
                  onSelectOption={updateEmailFrequency}
                />
              </Row>
            </Grouping>
          </GroupableList>
        </div>
      </div>
    </Page>
  )
}

export default NotificationsSettingsPage
