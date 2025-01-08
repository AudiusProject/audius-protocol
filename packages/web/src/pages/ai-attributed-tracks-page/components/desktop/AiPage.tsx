import { User } from '@audius/common/models'
import { IconRobot } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import Lineup, { LineupProps } from 'components/lineup/Lineup'
import Page from 'components/page/Page'
import UserBadges from 'components/user-badges/UserBadges'
import { fullAiPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './AiPage.module.css'
import { ShareAiTracksTile } from './ShareAiTracksTile'

const messages = {
  aiAttributed: 'Tracks generated with AI trained on music',
  by: 'by',

  getDescription: (artistName: string) =>
    `${messages.aiAttributed} ${messages.by} ${artistName}`
}

export type AiPageProps = {
  title: string
  user: User | null
  getLineupProps: () => LineupProps
  goToArtistPage: () => void
}

const g = withNullGuard(({ user, ...p }: AiPageProps) => user && { ...p, user })

const AiPage = g(({ title, user, getLineupProps, goToArtistPage }) => {
  const renderHeader = () => (
    <Header
      icon={IconRobot}
      primary={title}
      secondary={
        <div className={styles.headerSecondary}>
          {messages.aiAttributed} {messages.by}
          <div className={styles.link} onClick={goToArtistPage}>
            {user.name}
            <UserBadges
              className={styles.iconVerified}
              userId={user.user_id}
              badgeSize={12}
            />
          </div>
        </div>
      }
      containerStyles={styles.header}
    />
  )

  return (
    <Page
      title={title}
      description={messages.getDescription(user.name)}
      canonicalUrl={fullAiPage(user.handle)}
      header={renderHeader()}
    >
      <Lineup {...getLineupProps()} endOfLineup={<ShareAiTracksTile />} />
    </Page>
  )
})

export default AiPage
