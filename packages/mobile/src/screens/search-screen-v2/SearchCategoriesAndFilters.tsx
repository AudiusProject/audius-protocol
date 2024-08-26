import { useCallback, useRef } from 'react'

import type {
  SearchFilter,
  SearchCategory as SearchCategoryType
} from '@audius/common/api'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollView } from 'react-native'

import { Flex, IconCloseAlt, SelectablePill } from '@audius/harmony-native'

import { BpmFilter } from './BpmFilter'
import {
  GenreFilter,
  IsPremiumFilter,
  IsVerifiedFilter,
  KeyFilter,
  MoodFilter
} from './SearchFilters'
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
      // Disable unselect animation when the category is selected
      // to avoid a flash of purple as the pills rearrange
      disableUnselectAnimation
    />
  )
}

const filtersByCategory: Record<SearchCategoryType, SearchFilter[]> = {
  all: [],
  users: ['genre', 'isVerified'],
  tracks: [
    'genre',
    'mood',
    'key',
    'bpm',
    'isPremium',
    'hasDownloads',
    'isVerified'
  ],
  albums: ['genre', 'mood', 'isPremium', 'hasDownloads', 'isVerified'],
  playlists: ['genre', 'mood', 'isVerified']
}

const searchFilterButtons = {
  genre: GenreFilter,
  mood: MoodFilter,
  key: KeyFilter,
  bpm: BpmFilter,
  isPremium: IsPremiumFilter,
  isVerified: IsVerifiedFilter
}

export const SearchCategoriesAndFilters = () => {
  const [category] = useSearchCategory()
  const [filters] = useSearchFilters()

  const scrollViewRef = useRef<ScrollView>(null)

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false })
    }, [])
  )

  const categoryFilters = filtersByCategory[category]
  const activeFilterKeys = categoryFilters.filter((key) =>
    Boolean(filters[key])
  )
  const inactiveFilterKeys = categoryFilters.filter((key) => !filters[key])
  const sortedFilterKeys = [...activeFilterKeys, ...inactiveFilterKeys]

  return (
    <Flex backgroundColor='white'>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps='handled'
        ref={scrollViewRef}
      >
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <SearchCategory category='users' />
          <SearchCategory category='tracks' />
          <SearchCategory category='albums' />
          <SearchCategory category='playlists' />
          {sortedFilterKeys.map((filter) => {
            const SearchFilterButton = searchFilterButtons[filter]
            if (SearchFilterButton) {
              return <SearchFilterButton key={filter} />
            }
            return null
          })}
        </Flex>
      </ScrollView>
    </Flex>
  )
}
