import { useCallback } from 'react'

import { Nullable } from '@audius/common'
import { HarmonyButton } from '@audius/stems'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'

import { CoverPhotoField } from '../components/CoverPhotoField'
import { ProfilePictureField } from '../components/ProfilePictureField'

import { SelectGenreState } from './SelectGenrePage'

const messages = {
  header: 'Finish Your Profile',
  description:
    'Your photos & display name is how others see you. Customize with special character, spaces, emojis, whatever!',
  displayName: 'Display Name',
  continue: 'Continue'
}

export type FinishProfileState = {
  stage: 'finish-profile'
}

type FinishProfilePageProps = {
  onNext: (state: SelectGenreState) => void
}

type FinishProfileValues = {
  profile_picture: Nullable<{ file: File; url: string }>
  cover_photo: Nullable<{ file: File; url: string }>
  displayName: string
}

const initialValues = {
  profile_picture: null,
  cover_photo: null,
  displayName: ''
}

export const FinishProfilePage = (props: FinishProfilePageProps) => {
  const { onNext } = props
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: FinishProfileValues) => {
      const { displayName } = values
      dispatch(setValueField('name', displayName))
      onNext({ stage: 'select-genre' })
    },
    [dispatch, onNext]
  )

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <CoverPhotoField />
          <ProfilePictureField />
          <TextField name='displayName' label={messages.displayName} />
          <HarmonyButton type='submit' text={messages.continue} />
        </Form>
      </Formik>
    </div>
  )
}
