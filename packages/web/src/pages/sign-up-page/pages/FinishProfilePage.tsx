import { useCallback } from 'react'

import { Nullable } from '@audius/common'
import { Button } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_PAGE } from 'utils/route'

import { CoverPhotoField } from '../components/CoverPhotoField'
import { ProfilePictureField } from '../components/ProfilePictureField'

import { SignUpStep } from './types'

const messages = {
  header: 'Finish Your Profile',
  description:
    'Your photos & display name is how others see you. Customize with special character, spaces, emojis, whatever!',
  displayName: 'Display Name',
  continue: 'Continue'
}

export type FinishProfileState = {
  stage: SignUpStep.finishProfile
}

type FinishProfilePageProps = {}

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
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleSubmit = useCallback(
    (values: FinishProfileValues) => {
      const { displayName } = values
      dispatch(setValueField('name', displayName))
      navigate(`${SIGN_UP_PAGE}/${SignUpStep.selectGenres}`)
    },
    [dispatch, navigate]
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
          <Button type='submit'> {messages.continue} </Button>
        </Form>
      </Formik>
    </div>
  )
}
