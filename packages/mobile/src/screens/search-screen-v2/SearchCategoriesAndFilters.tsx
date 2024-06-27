import { useCallback, useState } from 'react'

import { ScrollView } from 'react-native'

import { Button, Flex, IconPlus, SelectablePill } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

// TODO:
// - Need to update filters to use FilterButton when the component is created
// - Need to sort the filters to put filters with an active value first

type SearchCategory = 'all' | 'tracks' | 'profiles' | 'albums' | 'playlists'
type CategoryFilter =
  | 'genre'
  | 'mood'
  | 'key'
  | 'bpm'
  | 'isVerified'
  | 'isPremium'
  | 'hasDownloads'

const filterInfoMap: Record<CategoryFilter, { label: string; screen: string }> =
  {
    genre: { label: 'Genre', screen: 'SearchGenre' },
    mood: { label: 'Mood', screen: 'SearchMood' },
    key: { label: 'Key', screen: 'SearchKey' },
    bpm: { label: 'BPM', screen: 'SearchBpm' },
    isVerified: { label: 'Verified', screen: '' },
    isPremium: { label: 'Premium', screen: '' },
    hasDownloads: { label: 'Downloadable', screen: '' }
  }

const categoryFilters: Record<SearchCategory, CategoryFilter[]> = {
  all: [],
  profiles: ['genre', 'isVerified'],
  tracks: ['genre', 'mood', 'key', 'bpm', 'isPremium', 'hasDownloads'],
  albums: ['genre', 'mood', 'isPremium', 'hasDownloads'],
  playlists: ['genre', 'mood']
}

export const SearchCategoriesAndFilters = () => {
  const navigation = useNavigation()
  const [category, setCategory] = useState<SearchCategory>('all')

  const isCategoryActive = useCallback(
    (c: SearchCategory) => category === c,
    [category]
  )
  const isCategoryVisible = useCallback(
    (c: SearchCategory) => category === 'all' || isCategoryActive(c),
    [category, isCategoryActive]
  )

  const handleFilterPress = useCallback(
    (screenName: string) => {
      navigation.navigate(screenName)
    },
    [navigation]
  )

  const handleCategoryChange = useCallback(
    (val: SearchCategory) => {
      setCategory(isCategoryActive(val) ? 'all' : val)
    },
    [isCategoryActive]
  )

  const categoryArr = ['Tracks', 'Profiles', 'Albums', 'Playlists']

  return (
    <Flex backgroundColor='white'>
      <ScrollView horizontal>
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <Flex direction='row' alignItems='center' gap='s'>
            {categoryArr.map((cat: string) =>
              isCategoryVisible(cat.toLowerCase() as SearchCategory) ? (
                <SelectablePill
                  type='radio'
                  size='large'
                  icon={
                    isCategoryActive(cat.toLowerCase() as SearchCategory)
                      ? IconPlus
                      : null
                  }
                  label={cat}
                  value={cat.toLowerCase()}
                  onChange={handleCategoryChange}
                />
              ) : null
            )}
          </Flex>
          <Flex direction='row' alignItems='center' gap='s'>
            {categoryFilters[category].map((filter) => (
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
        </Flex>
      </ScrollView>
    </Flex>
  )
}
