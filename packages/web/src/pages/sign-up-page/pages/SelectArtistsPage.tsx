import { ChangeEvent, useCallback, useState } from 'react'

import {
  ID,
  Status,
  useGetFeaturedArtists,
  useGetTopArtistsInGenre
} from '@audius/common'
import { Button } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { addFollowArtists } from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import { useSelector } from 'utils/reducer'

import { AppCtaState } from './AppCtaPage'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  genresLabel: 'Selected genres',
  continue: 'Continue',
  pickArtists: (genre: string) => `Pick ${genre} Artists`
}

export type SelectArtistsState = {
  stage: 'select-artists'
}

type SelectArtistsValues = {
  artists: ID[]
}

const initialValues: SelectArtistsValues = {
  artists: []
}

type SelectArtistsPageProps = {
  onNext: (state: AppCtaState) => void
}

export const SelectArtistsPage = (props: SelectArtistsPageProps) => {
  const { onNext } = props
  const genres = useSelector((state) => ['Featured', ...getGenres(state)])
  const [currentGenre, setCurrentGenre] = useState('Featured')
  const dispatch = useDispatch()

  const handleChangeGenre = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentGenre(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { artists } = values
      dispatch(addFollowArtists(artists))
      onNext({ stage: 'app-cta' })
    },
    [dispatch, onNext]
  )

  const isFeaturedArtists = currentGenre === 'Featured'

  const { data: topArtists, status: topArtistsStatus } =
    useGetTopArtistsInGenre(
      { genre: currentGenre },
      { disabled: isFeaturedArtists }
    )

  const { data: featuredArtists, status: featuredArtistsStatus } =
    useGetFeaturedArtists(undefined, {
      disabled: !isFeaturedArtists
    })

  const artists = isFeaturedArtists ? featuredArtists : topArtists
  const isLoading =
    (isFeaturedArtists ? topArtistsStatus : featuredArtistsStatus) ===
    Status.LOADING

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>
      <div role='radiogroup' aria-label={messages.genresLabel}>
        {genres.map((genre) => (
          <label key={genre}>
            <input
              type='radio'
              value={genre}
              checked={genre === currentGenre}
              onChange={handleChangeGenre}
            />
            {genre}
          </label>
        ))}
      </div>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values, setValues }) => {
          const { artists: selectedArtists } = values
          const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const { checked, name } = e.target
            const userId = parseInt(name, 10)
            const newArtists = checked
              ? [userId, ...selectedArtists]
              : selectedArtists.filter((value) => value !== userId)

            setValues({ artists: newArtists })
          }
          return (
            <Form>
              <fieldset>
                <legend>{messages.pickArtists(currentGenre)}</legend>
                {isLoading
                  ? null
                  : artists?.map((user) => {
                      const { user_id, name } = user

                      return (
                        <label key={user_id}>
                          <input
                            type='checkbox'
                            name={String(user_id)}
                            onChange={handleChange}
                            checked={selectedArtists.includes(user_id)}
                          />
                          {name}
                        </label>
                      )
                    })}
              </fieldset>
              <Button type='submit' text={messages.continue} />
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}
