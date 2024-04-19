import { useCallback } from 'react'

import { Status } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'

import { getDashboardTracksStatus, makeGetDashboard } from '../store/selectors'
import { fetchTracks } from '../store/slice'

import { showMoreLimit, tablePageSize } from './constants'
import { useFilteredTrackData } from './hooks'
import { TrackFilters } from './types'

const tracksTableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'length',
  'plays',
  'saves',
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
        fetchTracks({ offset: page * tablePageSize, limit: tablePageSize })
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
      pageSize={tablePageSize}
      userId={account.user_id}
      showMoreLimit={showMoreLimit}
      totalRowCount={account.track_count}
      loading={tracksStatus === Status.LOADING}
      isPaginated
    />
  )
}
