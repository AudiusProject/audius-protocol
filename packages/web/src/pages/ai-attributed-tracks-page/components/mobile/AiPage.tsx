import { useEffect, useContext } from 'react'

import { User } from '@audius/common'
import cn from 'classnames'

import IconRobot from 'assets/img/iconRobot.svg'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import Lineup, { LineupWithoutTile } from 'components/lineup/Lineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
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
  user: User | null
  getLineupProps: () => LineupWithoutTile
  goToArtistPage: () => void
}

const g = withNullGuard(({ user, ...p }: AiPageProps) => user && { ...p, user })

const AiPage = g(({ title, user, getLineupProps, goToArtistPage }) => {
  useSubPageHeader()

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header
          className={styles.header}
          title={
            <>
              <IconRobot
                className={cn(styles.iconRobot, {
                  [styles.matrix]: isMatrix()
                })}
              />
              <span>{title}</span>
            </>
          }
        />
      </>
    )
  }, [setHeader, title])

  return (
    <MobilePageContainer
      title={title}
      description={messages.getDescription(user.name)}
      canonicalUrl={fullAiPage(user.handle)}
      containerClassName={styles.container}
    >
      <div className={styles.tracksContainer}>
        <div className={styles.subHeader}>
          {messages.aiAttributed} {messages.by}
          <span className={styles.link} onClick={goToArtistPage}>
            {user.name}
            <UserBadges
              userId={user.user_id}
              badgeSize={10}
              className={styles.iconVerified}
            />
          </span>
        </div>
        <Lineup {...getLineupProps()} endOfLineup={<ShareAiTracksTile />} />
      </div>
    </MobilePageContainer>
  )
})

export default AiPage
