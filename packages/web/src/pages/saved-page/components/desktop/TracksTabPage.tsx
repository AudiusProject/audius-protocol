import { useLibraryTracks } from '@audius/common/api'
import { Status } from '@audius/common/models'
import {
  CommonState,
  lineupSelectors,
  savedPageSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom-v5-compat'

import { useTanQueryLineupProps } from 'components/lineup/hooks'
import { dateSorter } from 'components/table'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import EmptyTable from 'components/tracks-table/EmptyTable'
import { useMainContentRef } from 'pages/MainContentContext'

import { emptyStateMessages } from '../emptyStateMessages'

const { getTracksCategory, getSavedTracksLineup } = savedPageSelectors
const { makeGetTableMetadatas } = lineupSelectors

const selectTrackTableMetadatas = makeGetTableMetadatas(getSavedTracksLineup)

const selectSavedTracks = (state: CommonState) => {
  const { entries } = selectTrackTableMetadatas(state)
  return entries.map((entry, i) => {
    const { title, uid, user, dateSaved, duration, play_count } = entry
    const { name, handle } = user
    return {
      ...entry,
      key: `${title}_${uid}_${i}`,
      name: title,
      artist: name,
      handle,
      date: dateSaved,
      time: duration,
      plays: play_count
    }
  })
}

const messages = {
  emptyTracksBody: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending',
  noFilterResults: 'No tracks match your search'
}

const tableColumns: TracksTableColumn[] = [
  'playButton',
  'trackName',
  'artistName',
  'releaseDate',
  'savedDate',
  'length',
  'plays',
  'reposts',
  'overflowActions'
]

type TracksTabPageProps = {
  filterText: string
}

export const TracksTabPage = ({ filterText }: TracksTabPageProps) => {
  const mainContentRef = useMainContentRef()
  const navigate = useNavigate()
  const category = useSelector(getTracksCategory)

  const { lineup, loadNextPage, play, pause, isPlaying, status, pageSize } =
    useLibraryTracks({
      category,
      query: filterText
    })

  const tracks = useSelector(selectSavedTracks)

  const lineupProps = useTanQueryLineupProps()
  const { playingUid } = lineupProps

  const isEmpty = tracks?.length === 0

  const isLoading = status === Status.LOADING

  if (isEmpty && !isLoading) {
    return (
      <EmptyTable
        primaryText={emptyStateMessages.emptyTrackAllHeader}
        secondaryText={messages.emptyTracksBody}
        buttonLabel={messages.goToTrending}
        onClick={() => navigate(route.TRENDING_PAGE)}
      />
    )
  }

  const dataSource = lineup?.entries ?? []
  const playingIndex = dataSource.findIndex((entry) => entry.uid === playingUid)

  return (
    <Flex flex={1} direction='column' gap='s'>
      <TracksTable
        columns={tableColumns}
        data={tracks}
        defaultSorter={dateSorter('dateSaved')}
        fetchMoreTracks={loadNextPage}
        isVirtualized
        loading={isLoading}
        onClickRow={(record) => {
          if (record.uid === playingUid) {
            if (isPlaying) {
              pause()
            } else {
              play()
            }
          } else {
            play(record.uid)
          }
        }}
        playing={isPlaying}
        playingIndex={playingIndex}
        scrollRef={mainContentRef}
        fetchBatchSize={pageSize}
        {...lineupProps}
      />
    </Flex>
  )
}
