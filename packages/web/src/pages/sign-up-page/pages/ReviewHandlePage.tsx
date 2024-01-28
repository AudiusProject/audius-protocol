import { useCallback, useMemo } from 'react'

import { useAudiusQueryContext, pickHandleSchema } from '@audius/common'
import { Paper, useTheme } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  getCoverPhotoField,
  getHandleField,
  getLinkedSocialOnFirstPage,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { restrictedHandles } from 'utils/restrictedHandles'
import {
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_FINISH_PROFILE_PAGE
} from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { HandleField } from '../components/HandleField'
import { Heading, Page, PageFooter } from '../components/layout'

const messages = {
  heading: 'Review Your Handle',
  description:
    "We've connected your social account but need your help with an issue we encountered. "
}

type ReviewHandleValues = {
  handle: string
}

export const ReviewHandlePage = () => {
  const navigate = useNavigateToPage()
  const dispatch = useDispatch()
  const { spacing } = useTheme()

  const isLinkingSocialOnFirstPage = useSelector(getLinkedSocialOnFirstPage)
  const { value: handle } = useSelector(getHandleField)

  const coverPhoto = useSelector(getCoverPhotoField)
  const profileImage = useSelector(getProfileImageField)
  const hasImages = coverPhoto || profileImage

  const audiusQueryContext = useAudiusQueryContext()
  const validationSchema = useMemo(() => {
    return toFormikValidationSchema(
      pickHandleSchema({ audiusQueryContext, restrictedHandles })
    )
  }, [audiusQueryContext])

  const handleSubmit = useCallback(
    (values: ReviewHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigate(
        isLinkingSocialOnFirstPage
          ? SIGN_UP_CREATE_LOGIN_DETAILS
          : SIGN_UP_FINISH_PROFILE_PAGE
      )
    },
    [dispatch, navigate, isLinkingSocialOnFirstPage]
  )

  const initialValues = {
    handle
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      validateOnMount
    >
      {({ isValid }) => (
        <Page as={Form} transition='horizontal' centered>
          <Heading
            heading={messages.heading}
            description={messages.description}
          />
          {hasImages ? (
            <Paper gap='xl' direction='column'>
              <AccountHeader mode='viewing' size='small' isPaperHeader />
              <HandleField autoFocus css={{ padding: spacing.l }} />
            </Paper>
          ) : (
            <HandleField />
          )}
          <PageFooter buttonProps={{ disabled: !isValid }} />
        </Page>
      )}
    </Formik>
  )
}
