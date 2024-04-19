import { Nullable } from '@audius/common/utils'
import { Paper } from '@audius/harmony'
import { useSelector } from 'react-redux'

import {
  CollectionsTable,
  CollectionsTableColumn
} from 'components/collections-table'

import { makeGetDashboard } from '../store/selectors'

import { showMoreLimit } from './constants'
import { useFilteredAlbumData } from './hooks'
import { AlbumFilters } from './types'

const albumTableColumns: CollectionsTableColumn[] = [
  'spacer',
  'name',
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
      <CollectionsTable
        data={filteredData}
        columns={albumTableColumns}
        onClickRow={onClickRow}
        showMoreLimit={showMoreLimit}
        totalRowCount={account.track_count}
      />
    </Paper>
  )
}
