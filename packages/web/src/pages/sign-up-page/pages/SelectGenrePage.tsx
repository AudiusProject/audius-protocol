import { useCallback } from 'react'

import { Genre } from '@audius/common'
import { Form, Formik } from 'formik'

export type SelectGenreState = {
  stage: 'select-genre'
}

const messages = {
  header: 'Select Your Genres',
  description: 'Start by picking some of your favorite genres.'
}

type SelectGenreValues = {
  genres: Genre[]
}

const initialValues = {
  genres: []
}

export const SelectGenrePage = () => {
  const handleSubmit = useCallback((values: SelectGenreValues) => {}, [])

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>hello world</Form>
      </Formik>
    </div>
  )
}
