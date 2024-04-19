import { useCallback, useMemo } from 'react'

import {
  isContentUSDCPurchaseGated,
  Track,
  Status,
  isContentFollowGated,
  isContentCollectibleGated
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  IconSpecialAccess,
  IconCollectible,
  IconVisibilityHidden,
  IconVisibilityPublic,
  IconCart
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { TracksTable, TracksTableColumn } from 'components/tracks-table'

import { getDashboardTracksStatus, makeGetDashboard } from '../store/selectors'
import { fetchTracks } from '../store/slice'

import { showMoreLimit } from './constants'

// Pagination Constants
export const tablePageSize = 50

const messages = {
  public: 'Public',
  premium: 'Premium',
  specialAcess: 'SpecialAccess',
  gated: 'Gated',
  hidden: 'Hidden'
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

export type DataSourceTrack = Track & {
  key: string
  name: string
  date: string
  time?: number
  saves: number
  reposts: number
  plays: number
}

const formatTrackMetadata = (metadata: Track, i: number): DataSourceTrack => {
  return {
    ...metadata,
    key: `${metadata.title}_${metadata.dateListened}_${i}`,
    name: metadata.title,
    date: metadata.created_at,
    time: metadata.duration,
    saves: metadata.save_count,
    reposts: metadata.repost_count,
    plays: metadata.play_count
  }
}

export enum TrackFilters {
  PUBLIC = 'Public',
  PREMIUM = 'Premium',
  SPECIAL_ACCESS = 'SpecialAccess',
  COLLECTIBLE_GATED = 'CollectibleGated',
  HIDDEN = 'Hidden'
}

export const useArtistDashboardTrackFilters = ({
  selectedFilter,
  filterText
}: {
  selectedFilter: Nullable<TrackFilters>
  filterText: string
}) => {
  const { tracks: tracksRaw } = useSelector(makeGetDashboard())
  const tracks = tracksRaw
    .map((track: Track, i: number) => formatTrackMetadata(track, i))
    .filter((meta) => !meta.is_invalid)

  const {
    hasOnlyOneSection,
    publicTracks,
    specialAccessTracks,
    hiddenTracks,
    premiumTracks,
    collectibleGatedTracks
  } = useMemo(() => {
    const publicTracks = tracks.filter(
      (data) => data.is_unlisted === false && !data.is_stream_gated
    )
    const specialAccessTracks = tracks.filter(
      (data) =>
        data.is_stream_gated &&
        (isContentFollowGated(data.stream_conditions) ||
          isContentFollowGated(data.stream_conditions))
    )
    const hiddenTracks = tracks.filter((data) => !!data.is_unlisted)
    const premiumTracks = tracks.filter(
      (data) =>
        data.is_stream_gated &&
        isContentUSDCPurchaseGated(data.stream_conditions)
    )
    const collectibleGatedTracks = tracks.filter(
      (data) =>
        data.is_stream_gated &&
        isContentCollectibleGated(data.stream_conditions)
    )

    const arrays = [
      publicTracks,
      specialAccessTracks,
      hiddenTracks,
      premiumTracks,
      collectibleGatedTracks
    ]
    const nonEmptyArrays = arrays.filter((arr) => arr.length > 0)
    const hasOnlyOneSection = nonEmptyArrays.length === 1

    return {
      hasOnlyOneSection,
      publicTracks,
      specialAccessTracks,
      hiddenTracks,
      premiumTracks,
      collectibleGatedTracks
    }
  }, [tracks])

  let filteredData: DataSourceTrack[] = tracks
  switch (selectedFilter) {
    case TrackFilters.PUBLIC:
      filteredData = publicTracks
      break
    case TrackFilters.PREMIUM:
      filteredData = premiumTracks
      break
    case TrackFilters.SPECIAL_ACCESS:
      filteredData = specialAccessTracks
      break
    case TrackFilters.COLLECTIBLE_GATED:
      filteredData = collectibleGatedTracks
      break
    case TrackFilters.HIDDEN:
      filteredData = hiddenTracks
      break
    default:
      filteredData = tracks
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

    return filterButtonTrackOptions
  }, [collectibleGatedTracks, hiddenTracks, premiumTracks, specialAccessTracks])

  if (filterText) {
    filteredData = filteredData.filter((data) =>
      data.name.toLowerCase().includes(filterText.toLowerCase())
    )
  }

  return {
    data: tracks,
    filteredData,
    filterButtonOptions,
    hasOnlyOneSection
  }
}

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

  const { filteredData } = useArtistDashboardTrackFilters({
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
