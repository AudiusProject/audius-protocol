import { useRemixes } from '@audius/common/api'
import { Track, User } from '@audius/common/models'
import { remixesPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { IconRemix, Text, Flex, FilterButton } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import Page from 'components/page/Page'
import { useRemixPageParams } from 'pages/remixes-page/hooks'
import { useUpdateSearchParams } from 'pages/search-page/hooks'
import { fullTrackRemixesPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

const messages = {
  remixes: 'Remix',
  coSigned: 'Co-Signs',
  contestEntries: 'Contest Entries',
  originalTrack: 'Original Track'
}

export const REMIXES_PAGE_SIZE = 10

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

const RemixesPage = nullGuard(({ title, count = 0, originalTrack }) => {
  const updateSortParam = useUpdateSearchParams('sortMethod')
  const updateIsCosignParam = useUpdateSearchParams('isCosign')
  const updateIsContestEntryParam = useUpdateSearchParams('isContestEntry')

  const { sortMethod, isCosign, isContestEntry } = useRemixPageParams()
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
    lineup
  } = useRemixes({
    trackId: originalTrack?.track_id,
    includeOriginal: true,
    sortMethod,
    isCosign,
    isContestEntry
  })

  const renderHeader = () => (
    <Header icon={IconRemix} primary={title} containerStyles={styles.header} />
  )

  return (
    <Page
      title={title}
      canonicalUrl={fullTrackRemixesPage(originalTrack.permalink)}
      header={renderHeader()}
    >
      <Flex direction='column' gap='xl'>
        <Text variant='heading'>{messages.originalTrack}</Text>
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
          pageSize={REMIXES_PAGE_SIZE}
          actions={remixesPageLineupActions}
          leadingElementId={0}
          leadingElementDelineator={
            <Flex justifyContent='space-between'>
              <Text variant='heading'>
                {count} {pluralize(messages.remixes, count, 'es', !count)}
              </Text>
              <Flex gap='s' mb='xl'>
                <FilterButton
                  label={messages.coSigned}
                  value={isCosign}
                  onClick={() => updateIsCosignParam(isCosign ? '' : 'true')}
                />
                <FilterButton
                  label={messages.contestEntries}
                  value={isContestEntry}
                  onClick={() =>
                    updateIsContestEntryParam(isContestEntry ? '' : 'true')
                  }
                />
                <FilterButton
                  value={sortMethod ?? 'recent'}
                  variant='replaceLabel'
                  onChange={updateSortParam}
                  options={[
                    { label: 'Most Recent', value: 'recent' },
                    { label: 'Most Plays', value: 'plays' },
                    { label: 'Most Likes', value: 'likes' }
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
