import {
  useRemixes,
  useRemixContest,
  useCurrentUserId
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { remixMessages as messages } from '@audius/common/messages'
import { Track, User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { remixesPageLineupActions } from '@audius/common/store'
import { dayjs, pluralize } from '@audius/common/utils'
import {
  IconRemix,
  Text,
  Flex,
  FilterButton,
  IconTrophy,
  Button
} from '@audius/harmony'
import { Link } from 'react-router-dom'
import { useSearchParams as useParams } from 'react-router-dom-v5-compat'

import { Header } from 'components/header/desktop/Header'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import Page from 'components/page/Page'
import { useRemixPageParams } from 'pages/remixes-page/hooks'
import { useUpdateSearchParams } from 'pages/search-page/hooks'
import { fullTrackRemixesPage, pickWinnersPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

export const REMIXES_PAGE_SIZE = 10

export type RemixesPageProps = {
  title: string
  count: number | null
  originalTrack:
    | Pick<Track, 'track_id' | 'permalink' | 'title' | 'owner_id'>
    | undefined
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
  const [urlSearchParams] = useParams()
  const { isEnabled: isRemixContestEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST
  )
  const { data: contest } = useRemixContest(originalTrack?.track_id)
  const { data: currentUserId } = useCurrentUserId()

  const isRemixContest = isRemixContestEnabled && contest
  const isTrackOwner = currentUserId === originalTrack.owner_id
  const isRemixContestEnded =
    isRemixContest && dayjs(contest.endDate).isBefore(dayjs())

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

  const pickWinnersRoute = pickWinnersPage(originalTrack?.permalink)

  const renderHeader = () => (
    <Header
      icon={isRemixContest ? IconTrophy : IconRemix}
      primary={title}
      containerStyles={styles.header}
      rightDecorator={
        isTrackOwner && isRemixContestEnded ? (
          <Button size='small' asChild>
            <Link to={pickWinnersRoute}>{messages.pickWinners}</Link>
          </Button>
        ) : null
      }
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
                {count}{' '}
                {isRemixContest
                  ? pluralize(messages.submissions, count ?? 0)
                  : pluralize(messages.remixes, count ?? 0, 'es')}
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
