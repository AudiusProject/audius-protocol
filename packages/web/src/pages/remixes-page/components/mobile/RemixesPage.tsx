import { useEffect, useContext } from 'react'

import { useRemixesLineup } from '@audius/common/api'
import { Track, User } from '@audius/common/models'
import { remixesPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { IconRemix as IconRemixes } from '@audius/harmony'

import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/mobile/NavContext'
import UserBadges from 'components/user-badges/UserBadges'
import { fullTrackRemixesPage } from 'utils/route'
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
  originalTrack: Pick<Track, 'track_id' | 'permalink' | 'title'> | undefined
  user: User | undefined
  goToTrackPage: () => void
  goToArtistPage: () => void
}

const g = withNullGuard(
  ({ originalTrack, user, ...p }: RemixesPageProps) =>
    originalTrack && user && { ...p, originalTrack, user }
)

const RemixesPage = g(
  ({ title, count, originalTrack, user, goToTrackPage, goToArtistPage }) => {
    useSubPageHeader()
    const {
      data,
      isFetching,
      isPending,
      isError,
      hasNextPage,
      play,
      pause,
      loadNextPage,
      isPlaying,
      lineup,
      pageSize
    } = useRemixesLineup({
      trackId: originalTrack?.track_id
    })

    const { setHeader } = useContext(HeaderContext)
    useEffect(() => {
      setHeader(
        <>
          <Header
            className={styles.header}
            title={
              <>
                <IconRemixes className={styles.iconRemix} color='heading' />
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
                  size='3xs'
                  className={styles.iconVerified}
                />
              </div>
            </div>
          </div>
          <TanQueryLineup
            data={data}
            isFetching={isFetching}
            isPending={isPending}
            isError={isError}
            hasNextPage={hasNextPage}
            play={play}
            pause={pause}
            loadNextPage={loadNextPage}
            isPlaying={isPlaying}
            lineup={lineup}
            actions={remixesPageLineupActions}
            pageSize={pageSize}
          />
        </div>
      </MobilePageContainer>
    )
  }
)

export default RemixesPage
