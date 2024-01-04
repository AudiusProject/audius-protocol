import { useCallback, useMemo } from 'react'

import {
  pickHandleSchema,
  useAudiusQueryContext,
  reviewHandlePageMessages as messages
} from '@audius/common'
import { setValueField } from 'audius-client/src/common/store/pages/signon/actions'
import {
  getCoverPhotoField,
  getHandleField,
  getLinkedSocialOnFirstPage,
  getProfileImageField
} from 'audius-client/src/common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Paper } from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { ReadOnlyAccountHeader } from '../components/AccountHeader'
import { Heading, Page, PageFooter } from '../components/layout'
import type { SignUpScreenParamList } from '../types'
import { restrictedHandles } from '../utils/restrictedHandles'

type ReviewHandleValues = {
  handle: string
}

// Users land here if their handle doesn't work with our validation for some reason
export const ReviewHandleScreen = () => {
  const dispatch = useDispatch()
  const { value: handle } = useSelector(getHandleField)
  const { value: coverPhoto } = useSelector(getCoverPhotoField) ?? {}
  const { value: profileImage } = useSelector(getProfileImageField) ?? {}
  const hasImages = coverPhoto || profileImage
  const initialValues = {
    handle
  }
  const audiusQueryContext = useAudiusQueryContext()
  const navigation = useNavigation<SignUpScreenParamList>()
  const isLinkingSocialOnFirstPage = useSelector(getLinkedSocialOnFirstPage)

  const validationSchema = useMemo(() => {
    return toFormikValidationSchema(
      pickHandleSchema({ audiusQueryContext, restrictedHandles })
    )
  }, [audiusQueryContext])

  const handleSubmit = useCallback(
    (values: ReviewHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigation.navigate(
        isLinkingSocialOnFirstPage ? 'CreateLoginDetails' : 'FinishProfile'
      )
    },
    [dispatch, navigation, isLinkingSocialOnFirstPage]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      validateOnMount
      initialTouched={{ handle: true }}
    >
      {({ isValid }) => (
        <Page>
          <Heading
            heading={messages.heading}
            description={messages.description}
          />
          {hasImages ? (
            <Paper gap='xl' direction='column'>
              <ReadOnlyAccountHeader />
              <TextField name='handle' label={messages.handle} noGutter />
            </Paper>
          ) : (
            <TextField name='handle' label={messages.handle} noGutter />
          )}
          <PageFooter buttonProps={{ disabled: !isValid }} />
        </Page>
      )}
    </Formik>
  )
}
