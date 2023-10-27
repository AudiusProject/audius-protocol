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
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { TRENDING_PAGE } from 'utils/route'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  genresLabel: 'Selected genres',
  continue: 'Continue',
  pickArtists: (genre: string) => `Pick ${genre} Artists`
}

type SelectArtistsValues = {
  artists: ID[]
}

const initialValues: SelectArtistsValues = {
  artists: []
}

type SelectArtistsPageProps = {}

export const SelectArtistsPage = (props: SelectArtistsPageProps) => {
  const genres = useSelector((state) => ['Featured', ...getGenres(state)])
  const [currentGenre, setCurrentGenre] = useState('Featured')
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleChangeGenre = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentGenre(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { artists } = values
      dispatch(addFollowArtists(artists))
      // TODO: trigger CTA modal on trending page
      navigate(TRENDING_PAGE)
    },
    [dispatch, navigate]
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
              <Button type='submit'>{messages.continue}</Button>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}
