import { useCallback } from 'react'

import {
  finishProfileSchema,
  finishProfilePageMessages as messages
} from '@audius/common'
import { css } from '@emotion/native'
import { setValueField } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Paper, useTheme } from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { CoverPhotoField } from '../components/CoverPhotoField'
import { ProfilePictureField } from '../components/ProfilePictureField'
import { Heading, Page, PageFooter } from '../components/layout'
import type { SignUpScreenParamList } from '../types'

const finishProfileFormikSchema = toFormikValidationSchema(finishProfileSchema)

const initialValues = {
  profile_picture: null,
  cover_photo: null,
  displayName: ''
}

type FinishProfileValues = {
  displayName: string
}

export const FinishProfileScreen = () => {
  const navigation = useNavigation<SignUpScreenParamList>()
  const dispatch = useDispatch()
  const { spacing } = useTheme()

  const handleSubmit = useCallback(
    (values: FinishProfileValues) => {
      const { displayName } = values
      dispatch(setValueField('name', displayName))
      navigation.navigate('SelectGenre')
    },
    [dispatch, navigation]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={finishProfileFormikSchema}
    >
      {({ handleSubmit }) => (
        <Page>
          <Heading
            heading={messages.header}
            description={messages.description}
          />
          <Paper>
            <CoverPhotoField />
            <ProfilePictureField />
            <TextField
              name='displayName'
              label={messages.displayName}
              style={css({
                padding: spacing.l,
                paddingTop: spacing.unit10
              })}
            />
          </Paper>
          <PageFooter onSubmit={handleSubmit} />
        </Page>
      )}
    </Formik>
  )
}
