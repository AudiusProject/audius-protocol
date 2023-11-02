import { ChangeEvent, useCallback } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common'
import { Button } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { setField } from 'common/store/pages/signon/actions'
import {
  getHandleField,
  getNameField
} from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { SIGN_UP_ARTISTS_PAGE } from 'utils/route'

import { GenrePill } from '../components/GenrePill'

const messages = {
  header: 'Select Your Genres',
  description: 'Start by picking some of your favorite genres.',
  continue: 'Continue'
}

const genres = GENRES.map((genre) => ({
  value: genre,
  label: convertGenreLabelToValue(genre)
}))

type SelectGenreValues = Record<string, boolean>

const initialValues = genres.reduce(
  (acc, genre) => ({
    ...acc,
    [genre.value]: false
  }),
  {} as SelectGenreValues
)

export const SelectGenrePage = () => {
  const { value: displayName } = useSelector(getNameField)
  const { value: handle } = useSelector(getHandleField)
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleSubmit = useCallback(
    (values: SelectGenreValues) => {
      const genres = Object.keys(values).filter((genre) => values[genre])
      dispatch(setField('genres', genres))
      navigate(SIGN_UP_ARTISTS_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <div>
      <div>
        <p>{displayName}</p>
        <p>{handle}</p>
      </div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values, setValues }) => {
          const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            setValues({ ...values, [e.target.name]: !values[e.target.name] })
          }

          return (
            <Form>
              {genres.map((genre) => {
                const { label, value } = genre
                return (
                  <GenrePill
                    key={value}
                    label={label}
                    name={value}
                    checked={!!values[value]}
                    onChange={handleChange}
                  />
                )
              })}
              <Button type='submit'>{messages.continue}</Button>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}
