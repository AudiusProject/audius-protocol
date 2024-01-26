import { useCallback, useEffect, useState } from 'react'

import {
  Box,
  Button,
  Flex,
  IconArrowRight,
  IconKey,
  PlainButton,
  Text,
  TextInput
} from '@audius/harmony'
import {
  Modal,
  ModalContentPages,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useAsync } from 'react-use'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import styles from './ChangeEmailModal.module.css'
import { Formik, FormikHelpers, useField, useFormikContext } from 'formik'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { ModalForm } from 'components/modal-form/ModalForm'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { formatOtp } from '@audius/common'

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
  resendHelp: 'Didn’t get an email?',
  resend: 'Resend code.',
  code: 'Code',
  success: (email: string) => `Email successfully updated from ${email} to `,
  done: 'Done'
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

const ConfirmPasswordPage = () => {
  const [{ value: email }] = useField('email')
  return (
    <Flex direction='column' gap='xl'>
      <Text>{messages.confirmPasswordHelp}</Text>
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
  const [newEmailField] = useField('newEmail')
  const [{ value: email }, { error }] = useField('email')
  return (
    <Flex direction='column' gap='xl'>
      <Text>{messages.newEmailHelp}</Text>
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
        helperText={error ? error : null}
        label={messages.newEmail}
      />
    </Flex>
  )
}

const VerifyEmailPage = () => {
  const [{ value: newEmail }] = useField('newEmail')
  const [otpField, { error }, { setValue }] = useField('otp')
  const resend = useCallback(() => {
    const fn = async () => {
      await audiusBackendInstance.changeEmail(newEmail)
    }
    fn()
  }, [setValue])
  return (
    <Flex direction='column' gap='xl'>
      <Text>{messages.verifyEmailHelp}</Text>
      <TextInput
        {...otpField}
        label={messages.code}
        error={!!error}
        helperText={error ? error : null}
        onChange={(e) => {
          e.target.value = formatOtp(e.target.value)
          otpField.onChange(e)
        }}
      />
      <Text>
        {messages.resendHelp}
        <PlainButton onClick={resend}>{messages.resend}</PlainButton>
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
  }, [emailRequest.loading, setEmail])

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
  otp?: string
}

const initialValues: ChangeEmailFormValues = {
  email: '',
  password: '',
  newEmail: ''
}

export const ChangeEmailModal = ({
  isOpen,
  onClose
}: ChangeEmailModalProps) => {
  const [page, setPage] = useState(ChangeEmailPage.ConfirmPassword)

  const handleClosed = useCallback(() => {
    setPage(ChangeEmailPage.ConfirmPassword)
  }, [setPage])

  const handleSubmit = useCallback(
    async (
      values: ChangeEmailFormValues,
      helpers: FormikHelpers<ChangeEmailFormValues>
    ) => {
      const { email, password, newEmail, otp } = values
      const sanitizedOtp = otp ? otp.replace(/\s/g, '') : undefined
      if (page === ChangeEmailPage.ConfirmPassword) {
        const confirmed = await audiusBackendInstance.confirmCredentials(
          email,
          password,
          undefined, // otp
          true // don't check otp, dont return creds
        )
        if (confirmed) {
          setPage(ChangeEmailPage.NewEmail)
        } else {
          helpers.setFieldError('password', messages.invalidCredentials)
        }
      } else {
        try {
          // Try to change email
          const res = await audiusBackendInstance.changeEmail(
            newEmail,
            sanitizedOtp
          )
          if (res.ok) {
            await audiusBackendInstance.changeAuthCredentials(
              newEmail,
              password,
              password,
              email
            )
            setPage(ChangeEmailPage.Success)
          } else {
            // If OTP missing, go to OTP page
            const body = await res.json()
            if (body?.error === 'Missing otp') {
              setPage(ChangeEmailPage.VerifyEmail)
            } else {
              // avoid duplicate error handling logic by throwing here
              throw new Error(res.statusText)
            }
          }
        } catch (e) {
          if (page === ChangeEmailPage.VerifyEmail) {
            helpers.setFieldError('otp', messages.invalidCredentials)
          } else {
            helpers.setFieldError('newEmail', messages.somethingWrong)
          }
        }
      }
    },
    [page]
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
