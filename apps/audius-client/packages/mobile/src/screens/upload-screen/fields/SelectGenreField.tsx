import { GENRES } from '@audius/common'

import IconGenre from 'app/assets/images/iconGenre.svg'

import { ContextualSubmenuField } from './ContextualSubmenuField'

const messages = {
  genre: 'Genre',
  error: 'Selection Required'
}

const genres = GENRES.map((genre) => ({ value: genre, label: genre }))

export const SelectGenreField = () => {
  return (
    <ContextualSubmenuField
      name='genre'
      label={messages.genre}
      data={genres}
      required
      errorMessage={messages.error}
      ListSelectionProps={{
        renderItem: ({ item }) => <>{item.label}</>,
        screenTitle: 'Select Genre',
        icon: IconGenre,
        searchText: 'Select Genres'
      }}
    />
  )
}
