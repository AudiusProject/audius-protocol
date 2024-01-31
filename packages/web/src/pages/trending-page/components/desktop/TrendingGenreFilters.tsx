import { useState } from 'react'

import { getCanonicalName } from '@audius/common'
import { IconKebabHorizontal } from '@audius/harmony'

import SelectablePills from 'components/selectable-pill/SelectablePills'

import styles from './TrendingGenreFilters.module.css'

type TrendingGenreFiltersProps = {
  genre: string | null
  initialGenres: string[]
  didSelectGenre: (genre: string | null) => void
  didSelectMore: () => void
}

/**
 * TrendingGenreFilters maintains a row of toggleable buttons for filtering the trending lineups by genre.
 */
const TrendingGenreFilters = ({
  genre,
  initialGenres,
  didSelectGenre,
  didSelectMore
}: TrendingGenreFiltersProps) => {
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
  const content = [...initialGenres]

  // Set the last seen modal selected genre, and make sure we render it
  // even if it's not selected.
  if (isSelectedFromModal(genre) && genre !== lastModalSelectedGenre) {
    setLastModalSelectedGenre(genre)
    content.push(genre)
  } else if (lastModalSelectedGenre !== null) {
    content.push(lastModalSelectedGenre)
  }

  const didClickPill = (index: number) => {
    // Check if we hit all
    if (index === 0) {
      didSelectGenre(null)
      return
    }

    // Check if we hit overflow
    if (index === content.length) {
      didSelectMore()
      return
    }

    // Select a new genre
    didSelectGenre(content[index])
  }

  const selectedIndex = genre === null ? 0 : content.indexOf(genre)

  return (
    <SelectablePills
      content={[
        ...content.map(getCanonicalName),
        <div key='horizontal' className={styles.overflow}>
          <IconKebabHorizontal />
        </div>
      ]}
      onClickIndex={didClickPill}
      selectedIndex={selectedIndex}
    />
  )
}

export default TrendingGenreFilters
