import { useCallback } from 'react'

import {
  createPasswordPageMessages as messages,
  passwordSchema
} from '@audius/common'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_HANDLE_PAGE } from 'utils/route'

import { EnterPasswordSection } from '../components/EnterPasswordSection'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'

const initialValues = {
  password: '',
  confirmPassword: ''
}

export type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

const passwordFormikSchema = toFormikValidationSchema(passwordSchema)

export const CreatePasswordPage = () => {
  const dispatch = useDispatch()
  const emailField = useSelector(getEmailField)
  const navigate = useNavigateToPage()
  const { isMobile } = useMedia()

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))
      navigate(SIGN_UP_HANDLE_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={passwordFormikSchema}
    >
      {({ isValid, dirty }) => (
        <Page as={Form} transition={isMobile ? undefined : 'horizontal'}>
          <Heading
            heading={messages.createYourPassword}
            description={messages.description}
          />
          <Flex direction='column' h='100%' gap='l'>
            <ReadOnlyField
              label={messages.yourEmail}
              value={emailField.value}
            />
            <EnterPasswordSection />
          </Flex>
          <PageFooter
            shadow='flat'
            p={isMobile ? 'l' : '2xl'}
            prefix={<SignUpAgreementText />}
            buttonProps={{ disabled: !(dirty && isValid) }}
          />
        </Page>
      )}
    </Formik>
  )
}
