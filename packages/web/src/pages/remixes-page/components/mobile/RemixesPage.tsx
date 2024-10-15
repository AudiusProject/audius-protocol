import { useEffect, useContext } from 'react'

import { Track, User } from '@audius/common/models'
import { pluralize } from '@audius/common/utils'
import { IconRemix as IconRemixes } from '@audius/harmony'
import cn from 'classnames'

import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import Lineup, { LineupProps } from 'components/lineup/Lineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/mobile/NavContext'
import UserBadges from 'components/user-badges/UserBadges'
import { fullTrackRemixesPage } from 'utils/route'
import { isMatrix } from 'utils/theme/theme'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

const messages = {
  remixes: 'Remix',
  by: 'by',
  of: 'of',
  getDescription: (trackName: string, artistName: string) =>
    `${messages.remixes} ${messages.of} ${trackName} ${messages.by} ${artistName}`
}

export type RemixesPageProps = {
  title: string
  count: number | null
  originalTrack: Track | null
  user: User | null
  getLineupProps: () => LineupProps
  goToTrackPage: () => void
  goToArtistPage: () => void
}

const g = withNullGuard(
  ({ originalTrack, user, ...p }: RemixesPageProps) =>
    originalTrack && user && { ...p, originalTrack, user }
)

const RemixesPage = g(
  ({
    title,
    count,
    originalTrack,
    user,
    getLineupProps,
    goToTrackPage,
    goToArtistPage
  }) => {
    useSubPageHeader()

    const { setHeader } = useContext(HeaderContext)
    useEffect(() => {
      setHeader(
        <>
          <Header
            className={styles.header}
            title={
              <>
                <IconRemixes
                  className={cn(styles.iconRemix, {
                    [styles.matrix]: isMatrix()
                  })}
                />
                <span>{title}</span>
              </>
            }
          />
        </>
      )
    }, [setHeader, title, originalTrack, user, goToArtistPage, goToTrackPage])

    return (
      <MobilePageContainer
        title={title}
        description={messages.getDescription(originalTrack.title, user.name)}
        canonicalUrl={fullTrackRemixesPage(originalTrack.permalink)}
        containerClassName={styles.container}
      >
        <div className={styles.tracksContainer}>
          <div className={styles.subHeader}>
            {`${count || ''} ${pluralize(
              messages.remixes,
              count,
              'es',
              !count
            )} ${messages.of}`}
            <div className={styles.track}>
              <div className={styles.link} onClick={goToTrackPage}>
                {originalTrack.title}
              </div>
              {messages.by}
              <div className={styles.link} onClick={goToArtistPage}>
                {user.name}
                <UserBadges
                  userId={user.user_id}
                  badgeSize={10}
                  className={styles.iconVerified}
                />
              </div>
            </div>
          </div>
          <Lineup {...getLineupProps()} />
        </div>
      </MobilePageContainer>
    )
  }
)

export default RemixesPage
