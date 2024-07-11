import { useCallback } from 'react'

import type {
  SearchFilter,
  SearchCategory as SearchCategoryType
} from '@audius/common/api'
import { Image, ScrollView } from 'react-native'

import {
  FilterButton,
  Flex,
  IconCloseAlt,
  SelectablePill,
  spacing
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { moodMap } from 'app/utils/moods'

import { useSearchCategory, useSearchFilters } from './searchState'

type SearchCategoryProps = {
  category: SearchCategoryType
}

const SearchCategory = (props: SearchCategoryProps) => {
  const { category } = props
  const [currentCategory, setCategory] = useSearchCategory()
  const [, setFilters] = useSearchFilters()
  const isSelected = currentCategory === category

  const labelByCategory = {
    tracks: 'Tracks',
    users: 'Profiles',
    albums: 'Albums',
    playlists: 'Playlists'
  }

  if (currentCategory !== 'all' && !isSelected) return null

  return (
    <SelectablePill
      type='radio'
      size='large'
      value={category}
      label={labelByCategory[category]}
      isSelected={isSelected}
      onChange={(value, isSelected) => {
        // Clear Filters and change category
        setFilters({})
        setCategory(isSelected ? (value as SearchCategoryType) : 'all')
      }}
      icon={isSelected ? IconCloseAlt : undefined}
    />
  )
}

// TODO:
// - Need to sort the filters to put filters with an active value first
// - IconClose looks thicker than the designs

const filterInfoMap: Record<SearchFilter, { label: string; screen: string }> = {
  genre: { label: 'Genre', screen: 'FilterGenre' },
  mood: { label: 'Mood', screen: 'FilterMood' },
  key: { label: 'Key', screen: 'FilterKey' },
  bpm: { label: 'BPM', screen: 'FilterBpm' },
  isVerified: { label: 'Verified', screen: '' },
  isPremium: { label: 'Premium', screen: '' },
  hasDownloads: { label: 'Downloadable', screen: '' }
}

const filtersByCategory: Record<SearchCategoryType, SearchFilter[]> = {
  all: [],
  users: ['genre', 'isVerified'],
  tracks: ['genre', 'mood', 'key', 'bpm', 'isPremium', 'hasDownloads'],
  albums: ['genre', 'mood', 'isPremium', 'hasDownloads'],
  playlists: ['genre', 'mood']
}

export const SearchCategoriesAndFilters = () => {
  const navigation = useNavigation()
  const [category] = useSearchCategory()
  const [filters, setFilters] = useSearchFilters()

  const handleFilterPress = useCallback(
    (filter: string) => {
      if (filters[filter]) {
        // Clear filter value
        const newFilters = { ...filters }
        delete newFilters[filter]
        setFilters(newFilters)
      } else if (filterInfoMap[filter].screen) {
        navigation.navigate(filterInfoMap[filter].screen)
      } else {
        const newFilters = { ...filters }
        newFilters[filter] = true
        setFilters(newFilters)
      }
    },
    [filters, navigation, setFilters]
  )

  const getFilterLabel = (filter: string) => {
    if (filter === 'bpm') {
      return filters[filter] ? `${filters[filter]} BPM` : 'BPM'
    }

    return typeof filters[filter] === 'string'
      ? String(filters[filter])
      : filterInfoMap[filter].label
  }

  const getLeadingElement = (filter: string) => {
    if (filter === 'mood') {
      const mood = filters[filter]
      if (mood) {
        return (
          <Image
            source={moodMap[mood]}
            style={{ height: spacing.l, width: spacing.l }}
          />
        )
      }
    }
    return undefined
  }

  return (
    <Flex backgroundColor='white'>
      <ScrollView horizontal keyboardShouldPersistTaps='handled'>
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <SearchCategory category='users' />
          <SearchCategory category='tracks' />
          <SearchCategory category='albums' />
          <SearchCategory category='playlists' />
          {filtersByCategory[category].map((filter) => (
            <FilterButton
              key={filter}
              size='small'
              value={
                filters[filter] !== undefined
                  ? String(filters[filter])
                  : undefined
              }
              label={getFilterLabel(filter)}
              onPress={() => {
                handleFilterPress(filter)
              }}
              leadingElement={getLeadingElement(filter)}
            />
          ))}
        </Flex>
      </ScrollView>
    </Flex>
  )
}
