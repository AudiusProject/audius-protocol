import { useRemixes, useRemixContest } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { remixMessages as messages } from '@audius/common/messages'
import { Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { remixesPageLineupActions } from '@audius/common/store'
import {
  IconRemix,
  Text,
  Flex,
  FilterButton,
  IconTrophy
} from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import Page from 'components/page/Page'
import { useRemixPageParams } from 'pages/remixes-page/hooks'
import { useUpdateSearchParams } from 'pages/search-page/hooks'
import { fullTrackRemixesPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

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

const RemixesPage = nullGuard(({ title, originalTrack }) => {
  const updateSortParam = useUpdateSearchParams('sortMethod')
  const updateIsCosignParam = useUpdateSearchParams('isCosign')
  const updateIsContestEntryParam = useUpdateSearchParams('isContestEntry')
  const { isEnabled: isRemixContestEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST
  )
  const { data: contest } = useRemixContest(originalTrack?.track_id)
  const isRemixContest = isRemixContestEnabled && contest

  const { sortMethod, isCosign, isContestEntry } = useRemixPageParams()
  const {
    data,
    count,
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
    <Header
      icon={isRemixContest ? IconTrophy : IconRemix}
      primary={title}
      containerStyles={styles.header}
    />
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
                {messages.remixesTitle}
                {count !== undefined ? ` (${count})` : ''}
              </Text>
              <Flex gap='s' mb='xl'>
                <FilterButton
                  label={messages.coSigned}
                  value={isCosign ? 'true' : null}
                  onClick={() => updateIsCosignParam(isCosign ? '' : 'true')}
                />
                {isRemixContest ? (
                  <FilterButton
                    label={messages.contestEntries}
                    value={isContestEntry ? 'true' : null}
                    onClick={() =>
                      updateIsContestEntryParam(isContestEntry ? '' : 'true')
                    }
                  />
                ) : null}
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
