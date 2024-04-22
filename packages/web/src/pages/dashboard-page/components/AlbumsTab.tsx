import { Nullable } from '@audius/common/utils'
import { Paper } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'

import { makeGetDashboard } from '../store/selectors'

import { SHOW_MORE_LIMIT, TABLE_PAGE_SIZE } from './constants'
import { useFilteredAlbumData } from './hooks'
import { AlbumFilters } from './types'

const albumTableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'reposts',
  'overflowMenu'
]

type ArtistDashboardAlbumsTabProps = {
  selectedFilter: Nullable<AlbumFilters>
  filterText: string
  onClickRow: (record: any) => void
}

export const ArtistDashboardAlbumsTab = ({
  selectedFilter,
  filterText,
  onClickRow
}: ArtistDashboardAlbumsTabProps) => {
  const { account } = useSelector(makeGetDashboard())
  const filteredData = useFilteredAlbumData({
    selectedFilter,
    filterText
  })

  if (!filteredData.length || !account) return null

  return (
    <Paper w='100%' direction='column' mt='xl'>
      <TracksTable
        data={filteredData}
        disabledTrackEdit
        columns={albumTableColumns}
        onClickRow={onClickRow}
        pageSize={TABLE_PAGE_SIZE}
        userId={account.user_id}
        showMoreLimit={SHOW_MORE_LIMIT}
        totalRowCount={account.track_count}
      />
    </Paper>
  )
}
