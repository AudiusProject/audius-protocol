import { useState } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common/utils'

import { Text } from '@audius/harmony-native'
import IconGenre from 'app/assets/images/iconGenre.svg'
import { ListSelectionScreen } from 'app/screens/edit-track-screen/screens/ListSelectionScreen'

const messages = {
  screenTitle: 'Genre',
  searchText: 'Select Genre'
}

const genres = GENRES.map((genre) => ({
  value: convertGenreLabelToValue(genre),
  label: genre
}))

export const SelectGenreScreen = () => {
  const [value, setValue] = useState('')

  return (
    <ListSelectionScreen
      data={genres}
      renderItem={({ item }) => <Text>{item.label}</Text>}
      screenTitle={messages.screenTitle}
      icon={IconGenre}
      searchText={messages.searchText}
      value={value}
      onChange={setValue}
    />
  )
}
