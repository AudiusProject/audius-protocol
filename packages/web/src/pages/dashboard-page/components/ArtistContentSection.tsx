import { useState, useCallback } from 'react'

import { Nullable } from '@audius/common/utils'
import {
  SelectablePill,
  IconSearch,
  Paper,
  Flex,
  FilterButton,
  TextInput,
  TextInputSize
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { useGoToRoute } from 'hooks/useGoToRoute'

import { makeGetDashboard } from '../store/selectors'

import {
  AlbumFilters,
  ArtistDashboardAlbumsTab,
  useArtistDashboardAlbumFilters
} from './AlbumsTab'
import {
  ArtistDashboardTracksTab,
  TrackFilters,
  useArtistDashboardTrackFilters
} from './TracksTab'

// Pagination Constants
export const tablePageSize = 50

const messages = {
  allReleases: 'All Releases',
  tracks: 'Tracks',
  albums: 'Albums',
  search: (type: Pills) =>
    `Search ${type === Pills.TRACKS ? 'Tracks' : 'Albums'}`
}

enum Pills {
  TRACKS,
  ALBUMS
}

export const ArtistContentSection = () => {
  const goToRoute = useGoToRoute()
  const { account } = useSelector(makeGetDashboard())
  const [filterText, setFilterText] = useState('')
  const [selectedPill, setSelectedPill] = useState(Pills.TRACKS)
  const [selectedTrackFilter, setSelectedTrackFilter] =
    useState<Nullable<TrackFilters>>(null)
  const [selectedAlbumFilter, setSelectedAlbumFilter] =
    useState<Nullable<AlbumFilters>>(null)
  const isTracks = selectedPill === Pills.TRACKS

  const onClickRow = useCallback(
    (record: any) => {
      if (!account) return
      goToRoute(record.permalink)
    },
    [account, goToRoute]
  )

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
    filterButtonOptions: filterButtonTrackOptions,
    data: tracks,
    hasOnlyOneSection: hasOnlyOneTrackSection
  } = useArtistDashboardTrackFilters({
    selectedFilter: selectedTrackFilter,
    filterText
  })
  const {
    filterButtonOptions: filterButtonAlbumOptions,
    data: albums,
    hasOnlyOneSection: hasOnlyOneAlbumSection
  } = useArtistDashboardAlbumFilters({
    selectedFilter: selectedAlbumFilter,
    filterText
  })
  const filterButtonOptions = isTracks
    ? filterButtonTrackOptions
    : filterButtonAlbumOptions
  const shouldShowFilterButton =
    (isTracks && !hasOnlyOneTrackSection) ||
    (!isTracks && !hasOnlyOneAlbumSection)
  const shouldShowPills = tracks.length && albums.length

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
            shouldShowFilterButton ? (
              <FilterButton
                onSelect={handleSelectFilter}
                selection={isTracks ? selectedTrackFilter : selectedAlbumFilter}
                label={messages.allReleases}
                options={filterButtonOptions}
                popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
        <ArtistDashboardTracksTab
          selectedFilter={selectedTrackFilter}
          filterText={filterText}
          onClickRow={onClickRow}
        />
      ) : (
        <ArtistDashboardAlbumsTab
          selectedFilter={selectedAlbumFilter}
          filterText={filterText}
          onClickRow={onClickRow}
        />
      )}
    </Paper>
  )
}
