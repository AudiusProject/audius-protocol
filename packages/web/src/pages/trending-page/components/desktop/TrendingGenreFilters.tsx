import { ChangeEvent, useCallback, useState } from 'react'

import { getCanonicalName } from '@audius/common/utils'
import { Flex, IconKebabHorizontal, SelectablePill } from '@audius/harmony'

const messages = {
  all: 'All Genres',
  more: 'More genres'
}

const initialGenres = ['Electronic', 'Hip-Hop/Rap', 'Alternative']

type TrendingGenreFiltersProps = {
  currentGenre: string | null
  didSelectGenre: (genre: string | null) => void
  didSelectMore: () => void
}

/**
 * TrendingGenreFilters maintains a row of toggleable buttons for filtering the trending lineups by genre.
 */
export const TrendingGenreFilters = (props: TrendingGenreFiltersProps) => {
  const { currentGenre, didSelectGenre, didSelectMore } = props
  // type guard for whether this is a genre specified by the user via the modal
  const isSelectedFromModal = (genre: string | null): genre is string => {
    return genre !== null && initialGenres.indexOf(genre) === -1
  }

  // Need to store our the last user specified genre (e.g. one picked thru the modal)
  // so that we can keep it rendered even if the user subsequently selects
  // one of the preselected genres.
  const [lastModalSelectedGenre, setLastModalSelectedGenre] = useState<
    string | null
  >(null)

  // Avoid mutating initialGenres
  const genres = [...initialGenres]

  // Set the last seen modal selected genre, and make sure we render it
  // even if it's not selected.
  if (
    isSelectedFromModal(currentGenre) &&
    currentGenre !== lastModalSelectedGenre
  ) {
    setLastModalSelectedGenre(currentGenre)
    genres.push(currentGenre)
  } else if (lastModalSelectedGenre !== null) {
    genres.push(lastModalSelectedGenre)
  }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedGenre = e.target.value
      if (selectedGenre === messages.all) {
        didSelectGenre(null)
      } else {
        didSelectGenre(selectedGenre)
      }
    },
    [didSelectGenre]
  )

  return (
    <Flex gap='s' role='radiogroup' onChange={handleChange}>
      <SelectablePill
        type='radio'
        label={messages.all}
        value={messages.all}
        size='large'
        isSelected={currentGenre === null}
      />
      {genres.map((genre) => (
        <SelectablePill
          key={genre}
          type='radio'
          label={getCanonicalName(genre)}
          value={genre}
          size='large'
          isSelected={genre === currentGenre}
        />
      ))}
      <SelectablePill
        type='button'
        icon={IconKebabHorizontal}
        aria-label={messages.more}
        size='large'
        onClick={didSelectMore}
      />
    </Flex>
  )
}
