import { useCallback, useRef } from 'react'

import { createPasswordPageMessages } from '@audius/common/messages'
import { passwordSchema } from '@audius/common/schemas'
import {
  changePasswordActions,
  recoveryEmailActions
} from '@audius/common/store'
import { route, TEMPORARY_PASSWORD } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField, getIsGuest } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { EnterPasswordSection } from '../components/EnterPasswordSection'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'

const { changePassword } = changePasswordActions
const { SIGN_UP_HANDLE_PAGE } = route

const initialValues = {
  password: '',
  confirmPassword: ''
}

export type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

const passwordFormikSchema = toFormikValidationSchema(passwordSchema)
const { resendRecoveryEmail } = recoveryEmailActions

export const CreatePasswordPage = () => {
  const dispatch = useDispatch()
  const emailField = useSelector(getEmailField)

  const isGuest = useSelector(getIsGuest)

  const navigate = useNavigateToPage()
  const { isMobile } = useMedia()
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))

      if (isGuest) {
        dispatch(
          changePassword({
            email: emailField.value,
            oldPassword: TEMPORARY_PASSWORD,
            password
          })
        )
        dispatch(resendRecoveryEmail())
      }
      navigate(SIGN_UP_HANDLE_PAGE)
    },
    [dispatch, emailField, isGuest, navigate]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={passwordFormikSchema}
    >
      {({ isValid, dirty }) => (
        <Page
          as={Form}
          transition={isMobile ? undefined : 'horizontal'}
          autoFocusInputRef={passwordInputRef}
        >
          <Heading
            heading={createPasswordPageMessages.createYourPassword}
            description={createPasswordPageMessages.description}
          />
          <Flex direction='column' h='100%' gap='l'>
            <ReadOnlyField
              label={createPasswordPageMessages.yourEmail}
              value={emailField.value}
            />
            <EnterPasswordSection inputRef={passwordInputRef} />
          </Flex>
          <PageFooter
            shadow='flat'
            p={0}
            prefix={<SignUpAgreementText />}
            buttonProps={{ disabled: !(dirty && isValid) }}
          />
        </Page>
      )}
    </Formik>
  )
}
