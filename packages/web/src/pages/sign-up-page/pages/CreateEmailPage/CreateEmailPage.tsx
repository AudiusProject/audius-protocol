import { useCallback, useContext } from 'react'

import { AudiusQueryContext, signUpFetch } from '@audius/common'
import { Form, Formik, FormikHelpers } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { EMAIL_REGEX } from 'utils/email'
import { SIGN_IN_PAGE, SIGN_UP_PASSWORD_PAGE } from 'utils/route'

import { CreateEmailPageDesktop } from './CreateEmailPageDesktop'
import { CreateEmailPageMobile } from './CreateEmailPageMobile'
import { messages } from './messages'

type SignUpEmailValues = {
  email: string
}

const FormSchema = toFormikValidationSchema(
  z.object({
    email: z
      .string({ required_error: messages.invalidEmail })
      .regex(EMAIL_REGEX, { message: messages.invalidEmail })
  })
)

/**
 * Component responsible for form logic and controlling whether to show mobile/desktop.
 * UI render logic is split out into separate components for mobile/desktop
 */
export const CreateEmailPage = () => {
  const { isDesktop } = useMedia()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const queryContext = useContext(AudiusQueryContext)
  const existingEmailValue = useSelector(getEmailField)
  const initialValues = {
    email: existingEmailValue.value ?? ''
  }
  const submitHandler = useCallback(
    async (
      values: SignUpEmailValues,
      { setErrors }: FormikHelpers<SignUpEmailValues>
    ) => {
      const { email } = values
      if (queryContext !== null) {
        try {
          // Check identity API for existing emails
          const emailExists = await signUpFetch.isEmailInUse(
            { email },
            queryContext
          )
          // Set the email in the store
          dispatch(setValueField('email', values.email))
          if (emailExists) {
            // Redirect to sign in if the email exists already
            navigate(SIGN_IN_PAGE)
          } else {
            // Move onto the password page
            navigate(SIGN_UP_PASSWORD_PAGE)
          }
        } catch (e) {
          // Unknown error state ¯\_(ツ)_/¯
          setErrors({ email: messages.unknownError })
        }
      }
    },
    [dispatch, navigate, queryContext]
  )

  return (
    <Formik
      validationSchema={FormSchema}
      initialValues={initialValues}
      onSubmit={submitHandler}
      validateOnBlur
      validateOnChange={false}
    >
      <Form css={{ width: '100%', height: '100%' }}>
        {isDesktop ? <CreateEmailPageDesktop /> : <CreateEmailPageMobile />}
      </Form>
    </Formik>
  )
}
