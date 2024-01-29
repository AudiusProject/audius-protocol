import { useCallback, useContext, useEffect, useState } from 'react'

import {
  confirmEmailErrorMessages,
  confirmEmailSchema,
  formatOtp
} from '@audius/common'
import { confirmEmailMessages } from '@audius/common/messages'
import { Text, TextLink } from '@audius/harmony'
import { Form, Formik, useField } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField, signIn } from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getOtpField,
  getPasswordField
} from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { ToastContext } from 'components/toast/ToastContext'
import { useMedia } from 'hooks/useMedia'
import { Heading, Page, PageFooter } from 'pages/sign-up-page/components/layout'
import { useSelector } from 'utils/reducer'

const initialValues = {
  otp: ''
}

type ConfirmEmailValues = {
  otp: string
}

const ConfirmEmailSchema = toFormikValidationSchema(confirmEmailSchema)

export const ConfirmEmailPage = () => {
  const dispatch = useDispatch()
  const { isMobile } = useMedia()
  const { value: email } = useSelector(getEmailField)
  const { value: password } = useSelector(getPasswordField)
  const { value: otp } = useSelector(getOtpField)
  const isSubmitting = !!otp

  const handleSubmit = useCallback(
    (values: ConfirmEmailValues) => {
      const { otp } = values
      const sanitizedOtp = otp.replace(/\s/g, '')
      dispatch(setValueField('otp', sanitizedOtp))
      dispatch(signIn(email, password, sanitizedOtp))
    },
    [dispatch, email, password]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={ConfirmEmailSchema}
    >
      <Page as={Form} transition={isMobile ? undefined : 'horizontal'}>
        <Heading
          heading={confirmEmailMessages.title}
          description={confirmEmailMessages.description}
        />
        <VerificationCodeField />
        <Text variant='body'>
          {confirmEmailMessages.noEmailNotice} <ResendCodeLink />
        </Text>
        <PageFooter shadow='flat' buttonProps={{ isLoading: isSubmitting }} />
      </Page>
    </Formik>
  )
}

const VerificationCodeField = () => {
  const isInvalidOtp = useSelector(
    (state) =>
      getPasswordField(state).error.includes('400') &&
      getOtpField(state).value === ''
  )
  const [, , { setError }] = useField('otp')

  useEffect(() => {
    if (isInvalidOtp) {
      setError(confirmEmailErrorMessages.invalid)
    }
  }, [isInvalidOtp, setError])

  return (
    <HarmonyTextField
      name='otp'
      label={confirmEmailMessages.otpLabel}
      placeholder={confirmEmailMessages.otpPlaceholder}
      transformValueOnChange={formatOtp}
    />
  )
}

const ResendCodeLink = () => {
  const dispatch = useDispatch()
  const { value: email } = useSelector(getEmailField)
  const { value: password } = useSelector(getPasswordField)
  const { toast } = useContext(ToastContext)
  const [hasResentCode, setHasResendCode] = useState(false)

  const handleClick = useCallback(() => {
    dispatch(signIn(email, password))
    toast(confirmEmailMessages.resentToast)
    setHasResendCode(true)
  }, [dispatch, email, password, toast])

  return (
    <TextLink variant='visible' onClick={handleClick} disabled={hasResentCode}>
      {confirmEmailMessages.resendCode}
    </TextLink>
  )
}
