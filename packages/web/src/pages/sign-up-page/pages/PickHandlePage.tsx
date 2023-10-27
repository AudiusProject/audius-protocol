import { useCallback } from 'react'

import { Button } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

const messages = {
  header: 'Pick Your Handle',
  description:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue'
}

const initialValues = {
  handle: ''
}

type PickHandleValues = {
  handle: string
}

export const PickHandlePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigate(SIGN_UP_FINISH_PROFILE_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <TextField name='handle' label={messages.handle} />
          <Button type='submit'> {messages.continue} </Button>
        </Form>
      </Formik>
    </div>
  )
}
