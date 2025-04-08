import { useRemixes } from '@audius/common/api'
import { Track, User } from '@audius/common/models'
import { remixesPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { IconRemix, Text, Flex, FilterButton } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { TrackLink } from 'components/link/TrackLink'
import { UserLink } from 'components/link/UserLink'
import Page from 'components/page/Page'
import { useRemixPageParams } from 'pages/remixes-page/hooks'
import { useUpdateSearchParams } from 'pages/search-page/hooks'
import { fullTrackRemixesPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

const messages = {
  remixes: 'Remix',
  by: 'by',
  of: 'of',
  getDescription: (trackName: string, artistName: string) =>
    `${messages.remixes} ${messages.of} ${trackName} ${messages.by} ${artistName}`,
  coSigned: 'Co-Signs',
  contestEntries: 'Contest Entries'
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
  const updateSortParam = useUpdateSearchParams('sortMethod')
  const { sortMethod } = useRemixPageParams()

  const renderHeader = () => (
    <Header icon={IconRemix} primary={title} containerStyles={styles.header} />
  )
  console.log('asdf hasNextPage: ', data, hasNextPage)
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
          pageSize={5}
          leadingElementId={0}
          leadingElementDelineator={
            <Flex justifyContent='space-between'>
              <Text variant='heading'>
                {count} {pluralize(messages.remixes, count, 'es', !count)}
              </Text>
              <Flex gap='s'>
                {' '}
                <FilterButton label={messages.coSigned} value={null} />
                <FilterButton label={messages.contestEntries} value={null} />
                <FilterButton
                  value={sortMethod ?? 'relevant'}
                  variant='replaceLabel'
                  // optionsLabel={messages.sortOptionsLabel}
                  onChange={updateSortParam}
                  options={[
                    { label: 'Most Relevant', value: 'relevant' },
                    { label: 'Most Popular', value: 'popular' },
                    { label: 'Most Recent', value: 'recent' }
                  ]}
                />
              </Flex>
            </Flex>
          }
        />
      </Flex>
    </Page>
  )
})

export default RemixesPage
