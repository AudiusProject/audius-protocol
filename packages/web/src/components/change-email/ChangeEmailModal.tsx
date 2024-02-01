import { useCallback, useContext, useEffect, useState } from 'react'

import {
  isOtpMissingError,
  useChangeEmailFormConfiguration
} from '@audius/common/hooks'
import { formatOtp } from '@audius/common/schemas'
import {
  Box,
  Button,
  Flex,
  IconArrowRight,
  IconKey,
  Text,
  TextLink
} from '@audius/harmony'
import {
  Modal,
  ModalContentPages,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { Formik, useField, useFormikContext } from 'formik'
import { useAsync } from 'react-use'

import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
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
  verifyEmailHelp: 'Enter the verification code sent to your email.',
  resendHelp: 'Didn’t get an email? ',
  resend: 'Resend code.',
  code: 'Code',
  otpPlaceholder: '123 456',
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

export const ResendCodeLink = () => {
  const [{ value: email }] = useField('email')

  const [isSending, setIsSending] = useState(false)
  const { toast } = useContext(ToastContext)

  const handleClick = useCallback(async () => {
    setIsSending(true)
    const libs = await audiusBackendInstance.getAudiusLibsTyped()
    // Try to confirm without OTP to force OTP refresh
    try {
      await libs.identityService?.changeEmail({
        email
      })
    } catch (e) {
      if (isOtpMissingError(e)) {
        toast(messages.resentToast)
      } else {
        toast(messages.somethingWrong)
      }
    } finally {
      setIsSending(false)
    }
  }, [email, toast])
  return (
    <TextLink variant='visible' disabled={isSending} onClick={handleClick}>
      {messages.resend}
    </TextLink>
  )
}

const CurrentEmail = () => {
  const [{ value: oldEmail }, , { setValue: setOldEmail }] =
    useField('oldEmail')
  // Load the email for the user
  const emailRequest = useAsync(audiusBackendInstance.getUserEmail)
  useEffect(() => {
    if (emailRequest.value) {
      setOldEmail(emailRequest.value)
    }
  }, [emailRequest.loading, emailRequest.value, setOldEmail])
  return (
    <Text variant='body' size='m'>
      {oldEmail !== '' ? (
        oldEmail
      ) : (
        <LoadingSpinner className={styles.inlineSpinner} />
      )}
    </Text>
  )
}

export const ConfirmPasswordPage = () => {
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.confirmPasswordHelp}</Text>
      <Box>
        <Text variant='label' size={'xs'}>
          {messages.currentEmail}
        </Text>
        <CurrentEmail />
      </Box>
      <HarmonyPasswordField
        name='password'
        label={messages.currentPassword}
        autoComplete={'password'}
      />
    </Flex>
  )
}

export const NewEmailPage = () => {
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.newEmailHelp}</Text>
      <Box>
        <Text variant='label' size={'xs'}>
          {messages.currentEmail}
        </Text>
        <CurrentEmail />
      </Box>
      <HarmonyTextField name='email' label={messages.newEmail} />
    </Flex>
  )
}

export const VerifyEmailPage = () => {
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.verifyEmailHelp}</Text>
      <HarmonyTextField
        name={'otp'}
        label={messages.code}
        placeholder={messages.otpPlaceholder}
        transformValueOnChange={formatOtp}
      />
      <Text variant='body'>
        {messages.resendHelp}
        <ResendCodeLink />
      </Text>
    </Flex>
  )
}

export const SuccessPage = () => {
  const [{ value: oldEmail }] = useField('oldEmail')
  const [{ value: email }] = useField('email')
  return (
    <Text variant={'body'}>
      {messages.success(oldEmail)}
      <Text asChild strength={'strong'}>
        <span>{email}</span>
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

export const ChangeEmailModal = ({
  isOpen,
  onClose
}: ChangeEmailModalProps) => {
  const { page, setPage, ...formikConfig } = useChangeEmailFormConfiguration()

  const handleClosed = useCallback(() => {
    setPage(ChangeEmailPage.ConfirmPassword)
  }, [setPage])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={handleClosed}
      size='small'
    >
      <Formik {...formikConfig}>
        <ChangeEmailModalForm onClose={onClose} page={page} />
      </Formik>
    </Modal>
  )
}
