import { useEffect, useContext } from 'react'

import { useRemixes } from '@audius/common/api'
import { remixMessages as messages } from '@audius/common/messages'
import { Track, User } from '@audius/common/models'
import { remixesPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { Flex, Text, IconRemix as IconRemixes } from '@audius/harmony'

import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/mobile/NavContext'
import { fullTrackRemixesPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

export type RemixesPageProps = {
  title: string
  count: number | null
  originalTrack: Pick<Track, 'track_id' | 'permalink' | 'title'> | undefined
  user: User | undefined
  goToTrackPage: () => void
  goToArtistPage: () => void
}

const nullGuard = withNullGuard(
  ({ originalTrack, user, ...p }: RemixesPageProps) =>
    originalTrack && user && { ...p, originalTrack, user }
)

const RemixesPage = nullGuard(
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
    } = useRemixes({
      trackId: originalTrack?.track_id,
      includeOriginal: true
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
                <Text variant='heading' size='xs'>
                  {title}
                </Text>
              </>
            }
          />
        </>
      )
    }, [setHeader, title, originalTrack, user, goToArtistPage, goToTrackPage])

    return (
      <MobilePageContainer
        title={title}
        canonicalUrl={fullTrackRemixesPage(originalTrack.permalink)}
        containerClassName={styles.container}
      >
        <Flex direction='column' mt='3xl' gap='l' w='100%'>
          <Text variant='heading' size='xs'>
            {messages.originalTrack}
          </Text>
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
            leadingElementId={0}
            leadingElementDelineator={
              <Flex justifyContent='space-between' gap='l' mb='xl'>
                <Text variant='heading' size='xs'>
                  {count} {pluralize(messages.remixes, count, 'es', !count)}
                </Text>
              </Flex>
            }
          />
        </Flex>
      </MobilePageContainer>
    )
  }
)

export default RemixesPage
