import { useRemixes } from '@audius/common/api'
import { Track, User } from '@audius/common/models'
import { remixesPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { IconRemix, Text, Flex } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { TrackLink } from 'components/link/TrackLink'
import { UserLink } from 'components/link/UserLink'
import Page from 'components/page/Page'
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

const RemixesPage = g(({ title, count = 0, originalTrack, user }) => {
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

  const renderHeader = () => (
    <Header icon={IconRemix} primary={title} containerStyles={styles.header} />
  )
  return (
    <Page
      title={title}
      description={messages.getDescription(originalTrack.title, user.name)}
      canonicalUrl={fullTrackRemixesPage(originalTrack.permalink)}
      header={renderHeader()}
    >
      <Flex direction='column' gap='xl'>
        <Text variant='heading'>Original Track</Text>
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
            <Text variant='heading'>
              {count} {pluralize(messages.remixes, count, 'es', !count)}
            </Text>
          }
        />{' '}
      </Flex>
    </Page>
  )
})

export default RemixesPage
