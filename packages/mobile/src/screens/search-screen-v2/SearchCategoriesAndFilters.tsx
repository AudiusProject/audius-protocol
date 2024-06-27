import { useCallback, useState } from 'react'

import type { SearchCategory, SearchFilter } from '@audius/common/api'
import { Button, Flex, IconClose, SelectablePill } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { ScrollView } from 'react-native'

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

const filtersByCategory: Record<SearchCategory, SearchFilter[]> = {
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

  const categoryArray = ['Tracks', 'Profiles', 'Albums', 'Playlists']

  return (
    <Flex backgroundColor='white'>
      <ScrollView horizontal>
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <Flex direction='row' alignItems='center' gap='s'>
            {categoryArray.map((category: string) =>
              isCategoryVisible(category.toLowerCase() as SearchCategory) ? (
                <SelectablePill
                  type='radio'
                  size='large'
                  icon={
                    isCategoryActive(category.toLowerCase() as SearchCategory)
                      ? IconClose
                      : null
                  }
                  label={category}
                  value={category.toLowerCase()}
                  onChange={handleCategoryChange}
                />
              ) : null
            )}
          </Flex>
          <Flex direction='row' alignItems='center' gap='s'>
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
        </Flex>
      </ScrollView>
    </Flex>
  )
}
