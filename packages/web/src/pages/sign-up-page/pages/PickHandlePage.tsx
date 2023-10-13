import { useCallback } from 'react'

import { Button } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'

import { FinishProfileState } from './FinishProfilePage'

const messages = {
  header: 'Pick Your Handle',
  description:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue'
}

export type PickHandleState = {
  stage: 'pick-handle'
}

const initialValues = {
  handle: ''
}

type PickHandleValues = {
  handle: string
}

type PickHandlePageProps = {
  onNext: (state: FinishProfileState) => void
}

export const PickHandlePage = (props: PickHandlePageProps) => {
  const { onNext } = props
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      onNext({ stage: 'finish-profile' })
    },
    [dispatch, onNext]
  )

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <TextField name='handle' label={messages.handle} />
          <Button type='submit' text={messages.continue} />
        </Form>
      </Formik>
    </div>
  )
}
