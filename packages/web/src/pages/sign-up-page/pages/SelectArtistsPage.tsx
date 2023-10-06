import { ChangeEvent, useCallback, useState } from 'react'

import { getGenres } from 'common/store/pages/signon/selectors'
import { useSelector } from 'utils/reducer'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  continue: 'Continue'
}

export type SelectArtistsState = {
  stage: 'select-artists'
}

export const SelectArtistsPage = () => {
  const genres = useSelector((state) => ['Featured', ...getGenres(state)])
  const [currentGenre, setCurrentGenre] = useState('Featured')

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentGenre(e.target.value)
  }, [])

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>
      <div role='radiogroup'>
        {genres.map((genre) => (
          <label key={genre}>
            <input
              type='radio'
              value={genre}
              checked={genre === currentGenre}
              onChange={handleChange}
            />
            {genre}
          </label>
        ))}
      </div>
    </div>
  )
}
