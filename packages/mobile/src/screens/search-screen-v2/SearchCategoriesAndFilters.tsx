import { useCallback } from 'react'

import type {
  SearchFilter,
  SearchCategory as SearchCategoryType
} from '@audius/common/api'
import { ScrollView } from 'react-native'

import {
  Button,
  Flex,
  IconCloseAlt,
  SelectablePill
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { useSearchCategory } from './searchState'

type SearchCategoryProps = {
  category: SearchCategoryType
}

const SearchCategory = (props: SearchCategoryProps) => {
  const { category } = props
  const [currentCategory, setCategory] = useSearchCategory()
  const isSelected = currentCategory === category

  const categoryLabelMap = {
    tracks: 'Tracks',
    users: 'Profiles',
    albums: 'Albums',
    playlists: 'Playlists'
  }

  if (currentCategory && !isSelected) return null

  return (
    <SelectablePill
      type='radio'
      size='large'
      value={category}
      label={categoryLabelMap[category]}
      isSelected={isSelected}
      onChange={(value) => setCategory(value as SearchCategoryType)}
      icon={isSelected ? IconCloseAlt : undefined}
    />
  )
}

// TODO:
// - Need to update filters to use FilterButton when the component is created
// - Need to sort the filters to put filters with an active value first
// - IconClose looks thicker than the designs

const filterInfoMap: Record<SearchFilter, { label: string; screen: string }> = {
  genre: { label: 'Genre', screen: 'SearchGenre' },
  mood: { label: 'Mood', screen: 'SearchMood' },
  key: { label: 'Key', screen: 'SearchKey' },
  bpm: { label: 'BPM', screen: 'SearchBpm' },
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

  const handleFilterPress = useCallback(
    (screenName: string) => {
      navigation.navigate(screenName)
    },
    [navigation]
  )

  return (
    <Flex backgroundColor='white'>
      <ScrollView horizontal>
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <SearchCategory category='tracks' />
          <SearchCategory category='users' />
          <SearchCategory category='albums' />
          <SearchCategory category='playlists' />
          {filtersByCategory[category].map((filter) => (
            <Button
              key={filter}
              variant='tertiary'
              size='small'
              onPress={() =>
                handleFilterPress(filterInfoMap[filter].screen || 'Search')
              }
            >
              {filterInfoMap[filter].label}
            </Button>
          ))}
        </Flex>
      </ScrollView>
    </Flex>
  )
}
