import { convertGenreLabelToValue, GENRES } from '@audius/common'
import { useField } from 'formik'

import { IconGenre } from '@audius/harmony-native'
import { Text } from 'app/components/core'

import { ListSelectionScreen } from './ListSelectionScreen'

const messages = {
  screenTitle: 'Select Genre',
  searchText: 'Select Genres'
}

const genres = GENRES.map((genre) => ({
  value: convertGenreLabelToValue(genre),
  label: genre
}))

export const SelectGenreScreen = () => {
  const [{ value }, , { setValue }] = useField('genre')

  return (
    <ListSelectionScreen
      data={genres}
      renderItem={({ item }) => (
        <Text fontSize='large' weight='demiBold'>
          {item.label}
        </Text>
      )}
      screenTitle={messages.screenTitle}
      icon={IconGenre}
      searchText={messages.searchText}
      value={value}
      onChange={setValue}
    />
  )
}
