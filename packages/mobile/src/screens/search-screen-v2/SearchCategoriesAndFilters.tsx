import { ScrollView } from 'react-native'
import { SearchCategory as SearchCategoryType } from '@audius/common/api'

import { Flex, IconCloseAlt, SelectablePill } from '@audius/harmony-native'
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

export const SearchCategoriesAndFilters = () => {
  return (
    <Flex backgroundColor='white'>
      <ScrollView horizontal>
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <SearchCategory category='tracks' />
          <SearchCategory category='users' />
          <SearchCategory category='albums' />
          <SearchCategory category='playlists' />
        </Flex>
      </ScrollView>
    </Flex>
  )
}
