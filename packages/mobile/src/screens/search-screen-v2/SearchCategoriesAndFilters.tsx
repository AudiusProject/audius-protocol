import { ScrollView } from 'react-native'

import { Flex, SelectablePill } from '@audius/harmony-native'

export const SearchCategoriesAndFilters = () => {
  return (
    <Flex backgroundColor='white'>
      <ScrollView horizontal>
        <Flex direction='row' alignItems='center' gap='s' p='l' pt='s'>
          <SelectablePill type='radio' size='large' label='Tracks' />
          <SelectablePill type='radio' size='large' label='Profiles' />
          <SelectablePill type='radio' size='large' label='Albums' />
          <SelectablePill type='radio' size='large' label='Playlists' />
        </Flex>
      </ScrollView>
    </Flex>
  )
}
