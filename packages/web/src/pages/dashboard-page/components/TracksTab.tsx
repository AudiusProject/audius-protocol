import { useCallback } from 'react'

import { Status } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'

import { getDashboardTracksStatus, makeGetDashboard } from '../store/selectors'
import { fetchTracks } from '../store/slice'

import { SHOW_MORE_LIMIT, TABLE_PAGE_SIZE } from './constants'
import { useFilteredTrackData } from './hooks'
import { TrackFilters } from './types'

const tracksTableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'length',
  'plays',
  'reposts',
  'overflowMenu'
]

type ArtistDashboardTracksTabProps = {
  selectedFilter: Nullable<TrackFilters>
  filterText: string
  onClickRow: (record: any) => void
}

export const ArtistDashboardTracksTab = ({
  selectedFilter,
  filterText,
  onClickRow
}: ArtistDashboardTracksTabProps) => {
  const dispatch = useDispatch()
  const tracksStatus = useSelector(getDashboardTracksStatus)
  const { account } = useSelector(makeGetDashboard())

  const handleFetchPage = useCallback(
    (page: number) => {
      dispatch(
        fetchTracks({ offset: page * TABLE_PAGE_SIZE, limit: TABLE_PAGE_SIZE })
      )
    },
    [dispatch]
  )

  const filteredData = useFilteredTrackData({
    selectedFilter,
    filterText
  })

  if (!filteredData.length || !account) return null

  return (
    <TracksTable
      data={filteredData}
      disabledTrackEdit
      columns={tracksTableColumns}
      onClickRow={onClickRow}
      fetchPage={handleFetchPage}
      pageSize={TABLE_PAGE_SIZE}
      userId={account.user_id}
      showMoreLimit={SHOW_MORE_LIMIT}
      totalRowCount={account.track_count}
      loading={tracksStatus === Status.LOADING}
      isPaginated
    />
  )
}
