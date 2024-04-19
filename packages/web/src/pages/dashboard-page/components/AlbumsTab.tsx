import { useMemo } from 'react'

import { isContentUSDCPurchaseGated, Collection } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import {
  IconVisibilityHidden,
  IconVisibilityPublic,
  IconCart,
  Paper
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'

import { makeGetDashboard } from '../store/selectors'

import { showMoreLimit } from './constants'

const { getAccountAlbums } = accountSelectors

// Pagination Constants
export const tablePageSize = 50

const messages = {
  public: 'Public',
  premium: 'Premium',
  hidden: 'Hidden'
}

const albumTableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'reposts',
  'overflowMenu'
]

export type DataSourceAlbum = Collection & {
  key: string
  name: string
  date: string
  saves: number
  reposts: number
}

export enum AlbumFilters {
  PUBLIC = 'Public',
  PREMIUM = 'Premium',
  HIDDEN = 'Hidden'
}

const formatAlbumMetadata = (album: Collection): DataSourceAlbum => {
  return {
    ...album,
    key: String(album.playlist_id),
    name: album.playlist_name,
    date: album.created_at,
    saves: album.save_count,
    reposts: album.repost_count
  }
}

export const useArtistDashboardAlbumFilters = ({
  selectedFilter,
  filterText
}: {
  selectedFilter: Nullable<AlbumFilters>
  filterText: string
}) => {
  const albumsRaw = useSelector(getAccountAlbums) ?? []
  const albums = albumsRaw?.map((album) => formatAlbumMetadata(album))

  const { hasOnlyOneSection, publicAlbums, hiddenAlbums, premiumAlbums } =
    useMemo(() => {
      const publicAlbums = albums.filter(
        (data) => data.is_private === false && !data.is_stream_gated
      )
      const hiddenAlbums = albums.filter((data) => !!data.is_private)
      const premiumAlbums = albums.filter(
        (data) =>
          data.is_stream_gated &&
          isContentUSDCPurchaseGated(data.stream_conditions)
      )

      const arrays = [publicAlbums, hiddenAlbums, premiumAlbums]
      const nonEmptyArrays = arrays.filter((arr) => arr.length > 0)
      const hasOnlyOneSection = nonEmptyArrays.length === 1

      return {
        hasOnlyOneSection,
        publicAlbums,
        hiddenAlbums,
        premiumAlbums
      }
    }, [albums])

  const filterButtonOptions = useMemo(() => {
    const filterButtonAlbumOptions = [
      {
        id: AlbumFilters.PUBLIC,
        label: messages.public,
        icon: IconVisibilityPublic,
        value: AlbumFilters.PUBLIC
      }
    ]
    if (premiumAlbums.length) {
      filterButtonAlbumOptions.push({
        id: AlbumFilters.PREMIUM,
        label: messages.premium,
        icon: IconCart,
        value: AlbumFilters.PREMIUM
      })
    }
    if (hiddenAlbums.length) {
      filterButtonAlbumOptions.push({
        id: AlbumFilters.HIDDEN,
        label: messages.hidden,
        icon: IconVisibilityHidden,
        value: AlbumFilters.HIDDEN
      })
    }

    return filterButtonAlbumOptions
  }, [hiddenAlbums, premiumAlbums])

  let filteredData: DataSourceAlbum[] = albums
  switch (selectedFilter) {
    case AlbumFilters.PUBLIC:
      filteredData = publicAlbums
      break
    case AlbumFilters.PREMIUM:
      filteredData = premiumAlbums
      break
    case AlbumFilters.HIDDEN:
      filteredData = hiddenAlbums
      break
    default:
      filteredData = albums
      break
  }

  if (filterText) {
    filteredData = filteredData.filter((data) =>
      data.name.toLowerCase().includes(filterText.toLowerCase())
    )
  }

  return {
    data: albums,
    filteredData,
    filterButtonOptions,
    hasOnlyOneSection
  }
}

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
  const { filteredData } = useArtistDashboardAlbumFilters({
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
        pageSize={tablePageSize}
        userId={account.user_id}
        showMoreLimit={showMoreLimit}
        totalRowCount={account.track_count}
      />
    </Paper>
  )
}
