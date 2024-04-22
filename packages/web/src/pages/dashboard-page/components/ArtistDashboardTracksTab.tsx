import { useCallback } from 'react'

import { Status } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { getDashboardTracksStatus, makeGetDashboard } from '../store/selectors'
import { fetchTracks } from '../store/slice'

import { EmptyTabState } from './EmptyTabState'
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
}

export const ArtistDashboardTracksTab = ({
  selectedFilter,
  filterText
}: ArtistDashboardTracksTabProps) => {
  const dispatch = useDispatch()
  const goToRoute = useGoToRoute()
  const tracksStatus = useSelector(getDashboardTracksStatus)
  const { account } = useSelector(makeGetDashboard())
  const filteredData = useFilteredTrackData({
    selectedFilter,
    filterText
  })

  const handleFetchPage = useCallback(
    (page: number) => {
      dispatch(
        fetchTracks({ offset: page * TABLE_PAGE_SIZE, limit: TABLE_PAGE_SIZE })
      )
    },
    [dispatch]
  )

  const onClickRow = useCallback(
    (track: any) => {
      if (!account) return
      goToRoute(track.permalink)
    },
    [account, goToRoute]
  )

  return !filteredData.length || !account ? (
    <EmptyTabState type='track' />
  ) : (
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
