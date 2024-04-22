import { useCallback } from 'react'

import { Nullable } from '@audius/common/utils'
import { Paper } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { makeGetDashboard } from '../store/selectors'

import { EmptyTabState } from './EmptyTabState'
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

  return !filteredData.length || !account ? (
    <EmptyTabState type='album' />
  ) : (
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
