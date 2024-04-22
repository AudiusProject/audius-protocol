import { useCallback } from 'react'

import { Nullable } from '@audius/common/utils'
import { Paper } from '@audius/harmony'
import { useSelector } from 'react-redux'

import {
  CollectionsTable,
  CollectionsTableColumn
} from 'components/collections-table'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { makeGetDashboard } from '../store/selectors'

import { SHOW_MORE_LIMIT, TABLE_PAGE_SIZE } from './constants'
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
}

export const ArtistDashboardAlbumsTab = ({
  selectedFilter,
  filterText
}: ArtistDashboardAlbumsTabProps) => {
  const goToRoute = useGoToRoute()
  const { account } = useSelector(makeGetDashboard())
  const filteredData = useFilteredAlbumData({
    selectedFilter,
    filterText
  })

  const onClickRow = useCallback(
    (collection: any) => {
      if (!account) return
      goToRoute(collection.permalink)
    },
    [account, goToRoute]
  )

  if (!filteredData.length || !account) return null

  return (
    <Paper w='100%' direction='column' mt='xl'>
      <CollectionsTable
        data={filteredData}
        columns={albumTableColumns}
        onClickRow={onClickRow}
        showMoreLimit={SHOW_MORE_LIMIT}
        totalRowCount={account.track_count}
      />
    </Paper>
  )
}
