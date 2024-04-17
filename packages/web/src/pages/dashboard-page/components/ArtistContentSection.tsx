import { useState, useCallback, useMemo } from 'react'

import {
  isContentUSDCPurchaseGated,
  Track,
  User,
  Collection,
  Status
} from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import {
  SelectablePill,
  IconSpecialAccess,
  IconCollectible,
  IconSearch,
  IconVisibilityHidden,
  IconVisibilityPublic,
  IconCart,
  Paper,
  Flex,
  FilterButton,
  TextInput,
  TextInputSize
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import { useGoToRoute } from 'hooks/useGoToRoute'

import { getDashboardTracksStatus } from '../store/selectors'
import { fetchTracks } from '../store/slice'
const { getAccountAlbums } = accountSelectors

// Pagination Constants
export const tablePageSize = 50

const messages = {
  filterInputPlacehoder: 'Search Tracks',
  allReleases: 'All Releases',
  public: 'Public',
  premium: 'Premium',
  specialAcess: 'SpecialAccess',
  gated: 'Gated',
  hidden: 'Hidden',
  tracks: 'Tracks',
  albums: 'Albums',
  search: (type: Pills) =>
    `Search ${type === Pills.TRACKS ? 'Tracks' : 'Albums'}`
}

const tracksTableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'length',
  'plays',
  'reposts',
  'overflowMenu'
]

const albumTableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'reposts',
  'overflowMenu'
]

export type DataSourceTrack = Track & {
  key: string
  name: string
  date: string
  time?: number
  saves: number
  reposts: number
  plays: number
}

export type DataSourceAlbum = Collection & {
  key: string
  name: string
  date: string
  saves: number
  reposts: number
}

enum Pills {
  TRACKS,
  ALBUMS
}

enum TrackFilters {
  PUBLIC = 'Public',
  PREMIUM = 'Premium',
  SPECIAL_ACCESS = 'SpecialAccess',
  COLLECTIBLE_GATED = 'CollectibleGated',
  HIDDEN = 'Hidden'
}

enum AlbumFilters {
  PUBLIC = 'Public',
  PREMIUM = 'Premium',
  HIDDEN = 'Hidden'
}

const formatAlbum = (album: Collection): DataSourceAlbum => {
  return {
    ...album,
    key: String(album.playlist_id),
    name: album.playlist_name,
    date: album.created_at,
    saves: album.save_count,
    reposts: album.repost_count
  }
}

type ArtistContentSectionProps = {
  tracks: DataSourceTrack[]
  account: User
}

export const ArtistContentSection = ({
  tracks,
  account
}: ArtistContentSectionProps) => {
  const dispatch = useDispatch()
  const goToRoute = useGoToRoute()
  const [filterText, setFilterText] = useState('')
  const [selectedPill, setSelectedPill] = useState(Pills.TRACKS)
  const [selectedTrackFilter, setSelectedTrackFilter] =
    useState<Nullable<TrackFilters>>(null)
  const [selectedAlbumFilter, setSelectedAlbumFilter] =
    useState<Nullable<AlbumFilters>>(null)
  const isTracks = selectedPill === Pills.TRACKS
  const tracksStatus = useSelector(getDashboardTracksStatus)

  const albumsUnformatted = useSelector(getAccountAlbums) ?? []
  const albums = albumsUnformatted?.map((album) => formatAlbum(album))
  const shouldShowPills = tracks.length && albums.length

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilterText(val)
  }

  const handleSelectFilter = (value: string) => {
    if (isTracks) {
      setSelectedTrackFilter(value as TrackFilters)
    } else {
      setSelectedAlbumFilter(value as AlbumFilters)
    }
  }

  const onClickRow = useCallback(
    (record: any) => {
      if (!account) return
      goToRoute(record.permalink)
    },
    [account, goToRoute]
  )

  const handleFetchPage = useCallback(
    (page: number) => {
      dispatch(
        fetchTracks({ offset: page * tablePageSize, limit: tablePageSize })
      )
    },
    [dispatch]
  )

  const onClickPill = useCallback(
    (pill: Pills) => {
      setSelectedPill(pill)
      setFilterText('')

      // Reset filter button state when switching content types
      if (!isTracks && pill === Pills.TRACKS) {
        setSelectedAlbumFilter(null)
      } else if (isTracks && pill === Pills.ALBUMS) {
        setSelectedTrackFilter(null)
      }
    },
    [isTracks]
  )

  const {
    hasOnlyOneTrackSection,
    publicTracks,
    specialAccessTracks,
    hiddenTracks,
    premiumTracks,
    collectibleGatedTracks
  } = useMemo(() => {
    const publicTracks = tracks.filter(
      (data) =>
        data.is_unlisted === false &&
        !isContentUSDCPurchaseGated(data.stream_conditions)
    )
    const specialAccessTracks = tracks.filter(
      (data) =>
        'tip_user_id' in (data.stream_conditions || {}) ||
        'follow_user_id' in (data.stream_conditions || {})
    )
    const hiddenTracks = tracks.filter((data) => data.is_unlisted === true)
    const premiumTracks = tracks.filter(
      (data) => 'usdc_purchase' in (data.stream_conditions || {})
    )
    const collectibleGatedTracks = tracks.filter(
      (data) => 'nft_collection' in (data.stream_conditions || {})
    )

    const arrays = [
      publicTracks,
      specialAccessTracks,
      hiddenTracks,
      premiumTracks,
      collectibleGatedTracks
    ]
    const nonEmptyArrays = arrays.filter((arr) => arr.length > 0)
    const hasOnlyOneTrackSection = nonEmptyArrays.length === 1

    return {
      hasOnlyOneTrackSection,
      publicTracks,
      specialAccessTracks,
      hiddenTracks,
      premiumTracks,
      collectibleGatedTracks
    }
  }, [tracks])

  const { hasOnlyOneAlbumSection, publicAlbums, hiddenAlbums, premiumAlbums } =
    useMemo(() => {
      const publicAlbums = albums.filter(
        (data) =>
          data.is_private === false &&
          !isContentUSDCPurchaseGated(data.stream_conditions)
      )
      const hiddenAlbums = albums.filter((data) => data.is_private === true)
      const premiumAlbums = albums.filter(
        (data) => 'usdc_purchase' in (data.stream_conditions || {})
      )

      const arrays = [publicAlbums, hiddenAlbums, premiumAlbums]
      const nonEmptyArrays = arrays.filter((arr) => arr.length > 0)
      const hasOnlyOneAlbumSection = nonEmptyArrays.length === 1

      return {
        hasOnlyOneAlbumSection,
        publicAlbums,
        hiddenAlbums,
        premiumAlbums
      }
    }, [albums])

  let filteredTracks: DataSourceTrack[] = tracks
  let filteredAlbums: DataSourceAlbum[] = albums

  switch (selectedTrackFilter) {
    case TrackFilters.PUBLIC:
      filteredTracks = publicTracks
      break
    case TrackFilters.PREMIUM:
      filteredTracks = premiumTracks
      break
    case TrackFilters.SPECIAL_ACCESS:
      filteredTracks = specialAccessTracks
      break
    case TrackFilters.COLLECTIBLE_GATED:
      filteredTracks = collectibleGatedTracks
      break
    case TrackFilters.HIDDEN:
      filteredTracks = hiddenTracks
      break
    default:
      filteredTracks = tracks
      break
  }
  switch (selectedAlbumFilter) {
    case AlbumFilters.PUBLIC:
      filteredAlbums = publicAlbums
      break
    case AlbumFilters.PREMIUM:
      filteredAlbums = premiumAlbums
      break
    case AlbumFilters.HIDDEN:
      filteredAlbums = hiddenAlbums
      break
    default:
      filteredAlbums = albums
      break
  }

  const filterButtonOptions = useMemo(() => {
    const filterButtonTrackOptions = [
      {
        id: TrackFilters.PUBLIC,
        label: messages.public,
        icon: IconVisibilityPublic,
        value: TrackFilters.PUBLIC
      }
    ]
    if (premiumTracks.length) {
      filterButtonTrackOptions.push({
        id: TrackFilters.PREMIUM,
        label: messages.premium,
        icon: IconCart,
        value: TrackFilters.PREMIUM
      })
    }
    if (specialAccessTracks.length) {
      filterButtonTrackOptions.push({
        id: TrackFilters.SPECIAL_ACCESS,
        label: messages.specialAcess,
        icon: IconSpecialAccess,
        value: TrackFilters.SPECIAL_ACCESS
      })
    }
    if (collectibleGatedTracks.length) {
      filterButtonTrackOptions.push({
        id: TrackFilters.COLLECTIBLE_GATED,
        label: messages.gated,
        icon: IconCollectible,
        value: TrackFilters.COLLECTIBLE_GATED
      })
    }
    if (hiddenTracks.length) {
      filterButtonTrackOptions.push({
        id: TrackFilters.HIDDEN,
        label: messages.hidden,
        icon: IconVisibilityHidden,
        value: TrackFilters.HIDDEN
      })
    }

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

    return isTracks ? filterButtonTrackOptions : filterButtonAlbumOptions
  }, [
    isTracks,
    collectibleGatedTracks,
    hiddenAlbums,
    hiddenTracks,
    premiumAlbums,
    premiumTracks,
    specialAccessTracks
  ])

  if (filterText) {
    if (isTracks) {
      filteredTracks = filteredTracks.filter((data) =>
        data.name.toLowerCase().includes(filterText.toLowerCase())
      )
    } else {
      filteredAlbums = filteredAlbums.filter((data) =>
        data.name.toLowerCase().includes(filterText.toLowerCase())
      )
    }
  }

  if (!tracks.length && !albums.length) return null

  return (
    <Paper w='100%' direction='column' mt='xl'>
      <Flex ph='2xl' pv='l' justifyContent='space-between'>
        <Flex gap='2xl'>
          {shouldShowPills ? (
            <Flex gap='s'>
              <SelectablePill
                isSelected={selectedPill === Pills.TRACKS}
                label={messages.tracks}
                size='large'
                onClick={() => onClickPill(Pills.TRACKS)}
              />
              <SelectablePill
                isSelected={selectedPill === Pills.ALBUMS}
                label={messages.albums}
                size='large'
                onClick={() => onClickPill(Pills.ALBUMS)}
              />
            </Flex>
          ) : null}
          {
            // Only show filter button if there are multiple sections for the selected content type
            (isTracks && !hasOnlyOneTrackSection) ||
            (!isTracks && !hasOnlyOneAlbumSection) ? (
              <FilterButton
                onSelect={handleSelectFilter}
                selection={isTracks ? selectedTrackFilter : selectedAlbumFilter}
                label={messages.allReleases}
                options={filterButtonOptions}
              />
            ) : null
          }
        </Flex>
        <Flex>
          <TextInput
            placeholder={messages.search(selectedPill)}
            label={messages.search(selectedPill)}
            value={filterText}
            onChange={handleFilterChange}
            size={TextInputSize.SMALL}
            startIcon={IconSearch}
          />
        </Flex>
      </Flex>
      {selectedPill === Pills.TRACKS ? (
        <TracksTable
          data={filteredTracks}
          disabledTrackEdit
          columns={tracksTableColumns}
          onClickRow={onClickRow}
          fetchPage={handleFetchPage}
          pageSize={tablePageSize}
          userId={account.user_id}
          showMoreLimit={5}
          totalRowCount={account.track_count}
          loading={tracksStatus === Status.LOADING}
          isPaginated
        />
      ) : (
        <TracksTable
          data={filteredAlbums}
          disabledTrackEdit
          columns={albumTableColumns}
          onClickRow={onClickRow}
          pageSize={tablePageSize}
          userId={account.user_id}
          showMoreLimit={5}
          totalRowCount={account.track_count}
        />
      )}
    </Paper>
  )
}
