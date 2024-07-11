import { artistCategories } from 'common/store/pages/signon/types'
import { useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import type { AppState } from 'app/store'

import { ArtistCategoryButton } from './ArtistCategoryButton'

export const SelectArtistCategoryButtons = () => {
  const selectedCategory = useSelector(
    (state: AppState) => state.signOn.followArtists.selectedCategory
  )

  return (
    <Flex mb='l' gap='m' direction='row' wrap='wrap'>
      {artistCategories.map((category) => (
        <ArtistCategoryButton
          key={category}
          category={category}
          isSelected={category === selectedCategory}
        />
      ))}
    </Flex>
  )
}
