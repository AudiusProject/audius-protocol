import { useCallback, useContext, useEffect, useState } from 'react'

import { formatOtp } from '@audius/common'
import {
  Box,
  Button,
  Flex,
  IconArrowRight,
  IconKey,
  Text,
  TextInput,
  TextLink
} from '@audius/harmony'
import {
  Modal,
  ModalContentPages,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { Formik, FormikHelpers, useField, useFormikContext } from 'formik'
import { useAsync } from 'react-use'

import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ModalForm } from 'components/modal-form/ModalForm'
import { ToastContext } from 'components/toast/ToastContext'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import styles from './ChangeEmailModal.module.css'

const messages = {
  title: 'Change Email',
  confirmPasswordHelp: 'Please enter your current email and password.',
  currentEmail: 'Current Email',
  currentPassword: 'Current Password',
  newEmailHelp: 'Enter the new email you would like to use on Audius.',
  newEmail: 'New email',
  continue: 'Continue',
  invalidCredentials: 'Invalid credentials.',
  somethingWrong: 'Something went wrong.',
  verifyEmailHelp: 'Enter the verification code sent to your new email.',
  resendHelp: 'Didn’t get an email? ',
  resend: 'Resend code.',
  code: 'Code',
  success: (email: string) => `Email successfully updated from ${email} to `,
  done: 'Done',
  resentToast: 'Verification code resent.'
}

enum ChangeEmailPage {
  ConfirmPassword = 0,
  NewEmail = 1,
  VerifyEmail = 2,
  Success = 3
}

type ChangeEmailModalProps = {
  isOpen: boolean
  onClose: () => void
}

const OTP_ERROR = 'Missing otp'

const ConfirmPasswordPage = () => {
  const [{ value: email }] = useField('email')
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.confirmPasswordHelp}</Text>
      <Box>
        <Text variant='label' size={'xs'}>
          {messages.currentEmail}
        </Text>
        <Text variant='body' size='m'>
          {email !== '' ? (
            email
          ) : (
            <LoadingSpinner className={styles.inlineSpinner} />
          )}
        </Text>
      </Box>
      <HarmonyPasswordField name='password' label={messages.currentPassword} />
    </Flex>
  )
}

const NewEmailPage = () => {
  const [newEmailField, { error }] = useField('newEmail')
  const [{ value: email }] = useField('email')
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.newEmailHelp}</Text>
      <Box>
        <Text variant='label' size={'xs'}>
          {messages.currentEmail}
        </Text>
        <Text variant='body' size='m'>
          {email}
        </Text>
      </Box>
      <TextInput
        {...newEmailField}
        error={!!error}
        helperText={error}
        label={messages.newEmail}
      />
    </Flex>
  )
}

const VerifyEmailPage = () => {
  const [{ value: newEmail }] = useField('newEmail')
  const [otpField, { error }] = useField('otp')
  const [isSending, setIsSending] = useState(false)
  const { toast } = useContext(ToastContext)

  const resend = useCallback(() => {
    setIsSending(true)
    const fn = async () => {
      const libs = await audiusBackendInstance.getAudiusLibsTyped()
      try {
        // Trigger email by not including otp
        await libs.identityService!.changeEmail({
          email: newEmail
        })
      } catch (e) {
        //do nothing
      }
      setIsSending(false)
      toast(messages.resentToast)
    }
    fn()
  }, [toast, newEmail])

  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.verifyEmailHelp}</Text>
      <TextInput
        {...otpField}
        label={messages.code}
        error={!!error}
        helperText={error}
        onChange={(e) => {
          e.target.value = formatOtp(e.target.value)
          otpField.onChange(e)
        }}
      />
      <Text variant='body'>
        {messages.resendHelp}
        <TextLink variant='visible' disabled={isSending} onClick={resend}>
          {messages.resend}
        </TextLink>
      </Text>
    </Flex>
  )
}

const SuccessPage = () => {
  const [{ value: email }] = useField('email')
  const [{ value: newEmail }] = useField('newEmail')
  return (
    <Text variant={'body'}>
      {messages.success(email)}
      <Text asChild strength={'strong'}>
        <span>{newEmail}</span>
      </Text>
      !
    </Text>
  )
}

const ChangeEmailModalForm = ({
  onClose,
  page
}: Pick<ChangeEmailModalProps, 'onClose'> & {
  page: ChangeEmailPage
}) => {
  const { isSubmitting } = useFormikContext()
  const [, , { setValue: setEmail }] = useField('email')

  // Load the email for the user
  const emailRequest = useAsync(audiusBackendInstance.getUserEmail)
  useEffect(() => {
    if (emailRequest.value) {
      setEmail(emailRequest.value)
    }
  }, [emailRequest.loading, emailRequest.value, setEmail])

  const isSuccessPage = page === ChangeEmailPage.Success

  return (
    <ModalForm>
      <ModalHeader onClose={onClose}>
        <ModalTitle title={messages.title} icon={<IconKey />} />
      </ModalHeader>
      <ModalContentPages currentPage={page}>
        <ConfirmPasswordPage />
        <NewEmailPage />
        <VerifyEmailPage />
        <SuccessPage />
      </ModalContentPages>
      <ModalFooter className={styles.footer}>
        {isSuccessPage ? (
          <Button type='button' fullWidth onClick={onClose}>
            {messages.done}
          </Button>
        ) : (
          <Button
            type={'submit'}
            isLoading={isSubmitting}
            fullWidth
            iconRight={IconArrowRight}
          >
            {messages.continue}
          </Button>
        )}
      </ModalFooter>
    </ModalForm>
  )
}

type ChangeEmailFormValues = {
  email: string
  password: string
  newEmail: string
  otp: string
}

const initialValues: ChangeEmailFormValues = {
  email: '',
  password: '',
  newEmail: '',
  otp: ''
}

export const ChangeEmailModal = ({
  isOpen,
  onClose
}: ChangeEmailModalProps) => {
  const [page, setPage] = useState(ChangeEmailPage.ConfirmPassword)

  const handleClosed = useCallback(() => {
    setPage(ChangeEmailPage.ConfirmPassword)
  }, [setPage])

  const checkPassword = useCallback(
    async (values: ChangeEmailFormValues, onError: () => void) => {
      const { email, password } = values
      const libs = await audiusBackendInstance.getAudiusLibsTyped()
      try {
        await libs.Account?.confirmCredentials({
          username: email,
          password,
          softCheck: true
        })
        setPage(ChangeEmailPage.NewEmail)
      } catch (e) {
        onError()
      }
    },
    [setPage]
  )

  const changeEmail = useCallback(
    async (values: ChangeEmailFormValues, onError: () => void) => {
      const { email, password, newEmail, otp } = values
      const sanitizedOtp = otp.replace(/\s/g, '')
      const libs = await audiusBackendInstance.getAudiusLibsTyped()
      try {
        // Try to change email
        await libs.identityService!.changeEmail({
          email: newEmail,
          otp: sanitizedOtp
        })
        await libs.Account!.changeCredentials({
          newUsername: newEmail,
          newPassword: password,
          oldUsername: email,
          oldPassword: password
        })
        setPage(ChangeEmailPage.Success)
      } catch (e) {
        // If missing OTP, go to verify email page
        if (
          'response' in (e as any) &&
          (e as any).response?.data?.error === OTP_ERROR
        ) {
          setPage(ChangeEmailPage.VerifyEmail)
        } else {
          onError()
        }
      }
    },
    [page, setPage]
  )

  const handleSubmit = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
      if (page === ChangeEmailPage.ConfirmPassword) {
        await checkPassword(values, () => {
          helpers.setFieldError('password', messages.invalidCredentials)
        })
      } else if (page === ChangeEmailPage.VerifyEmail) {
        await changeEmail(values, () => {
          helpers.setFieldError('otp', messages.invalidCredentials)
        })
      } else {
        await changeEmail(values, () => {
          helpers.setFieldError('newEmail', messages.somethingWrong)
        })
      }
    },
    [page, setPage]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={handleClosed}
      size='small'
    >
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <ChangeEmailModalForm onClose={onClose} page={page} />
      </Formik>
    </Modal>
  )
}
