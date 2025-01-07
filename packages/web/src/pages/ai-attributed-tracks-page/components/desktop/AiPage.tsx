import { UserMetadata } from '@audius/common/models'
import { IconRobot } from '@audius/harmony'
import cn from 'classnames'

import Header from 'components/header/desktop/Header'
import Lineup, { LineupProps } from 'components/lineup/Lineup'
import Page from 'components/page/Page'
import UserBadges from 'components/user-badges/UserBadges'
import { fullAiPage } from 'utils/route'
import { isMatrix } from 'utils/theme/theme'
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
  user: UserMetadata | null
  getLineupProps: () => LineupProps
  goToArtistPage: () => void
}

const g = withNullGuard(({ user, ...p }: AiPageProps) => user && { ...p, user })

const AiPage = g(({ title, user, getLineupProps, goToArtistPage }) => {
  const renderHeader = () => (
    <Header
      wrapperClassName={styles.header}
      primary={
        <div className={styles.headerPrimary}>
          <IconRobot
            className={cn(styles.iconRobot, { [styles.matrix]: isMatrix() })}
          />
          <span>{title}</span>
        </div>
      }
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
