import { useCallback, useState } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common/utils'
import type { Genre } from '@audius/sdk'

import { Text } from '@audius/harmony-native'
import IconGenre from 'app/assets/images/iconGenre.svg'
import { ListSelectionScreen } from 'app/screens/list-selection-screen'

import { useSearchFilter } from '../searchState'

const messages = {
  screenTitle: 'Genre',
  searchText: 'Select Genre'
}

const genres = GENRES.map((genre) => ({
  value: convertGenreLabelToValue(genre),
  label: genre
}))

export const FilterGenreScreen = () => {
  const [genre, setGenre, clearGenre] = useSearchFilter('genre')
  const [value, setValue] = useState(genre ?? '')

  const handleSubmit = useCallback(() => {
    if (value) {
      setGenre(value as Genre)
    } else {
      clearGenre()
    }
  }, [clearGenre, setGenre, value])

  const handleClear = useCallback(() => {
    setValue('')
  }, [])

  return (
    <ListSelectionScreen
      data={genres}
      renderItem={({ item }) => <Text>{item.label}</Text>}
      screenTitle={messages.screenTitle}
      icon={IconGenre}
      searchText={messages.searchText}
      value={value}
      onChange={setValue}
      onClear={handleClear}
      onSubmit={handleSubmit}
      clearable={Boolean(value)}
    />
  )
}
