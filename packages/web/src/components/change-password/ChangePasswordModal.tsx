import { useCallback, useState } from 'react'

import { passwordSchema } from '@audius/common/schemas'
import {
  Button,
  Flex,
  IconArrowRight,
  IconLock,
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
import { Formik, FormikHelpers, useField, useFormikContext } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  VerifyEmailPage,
  isOtpMissing
} from 'components/change-email/ChangeEmailModal'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { ModalForm } from 'components/modal-form/ModalForm'
import { EnterPasswordSection } from 'pages/sign-up-page/components/EnterPasswordSection'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

import styles from './ChangePasswordModal.module.css'

const messages = {
  continue: 'Continue',
  changePassword: 'Change Password',
  confirmPasswordHelp: 'Please enter your current email and password.',
  email: 'Email',
  currentPassword: 'Current Password',
  passwordCompletionHelp:
    'Create a new password that’s secure and easy to remember!',
  invalidCredentials: 'Invalid credentials.',
  success: 'Your password was successfully changed!',
  done: 'Done'
}

enum ChangePasswordPage {
  ConfirmCredentials = 0,
  VerifyEmail = 1,
  NewPassword = 2,
  Success = 3
}

const ConfirmCredentialsPage = () => {
  const [emailField] = useField('email')
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.confirmPasswordHelp}</Text>
      <TextInput label={messages.email} {...emailField} />
      <HarmonyPasswordField
        name='oldPassword'
        label={messages.currentPassword}
      />
    </Flex>
  )
}

const NewPasswordPage = () => {
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.passwordCompletionHelp}</Text>
      <EnterPasswordSection />
    </Flex>
  )
}

const SuccessPage = () => {
  return <Text variant={'body'}>{messages.success}</Text>
}

const ChangePasswordModalForm = ({
  page,
  onClose
}: {
  page: ChangePasswordPage
  onClose: () => void
}) => {
  const [{ value: email }] = useField('email')
  const [{ value: oldPassword }] = useField('oldPassword')
  const { isSubmitting, isValid, dirty } = useFormikContext()
  const handleResend = useCallback(async () => {
    const libs = await audiusBackendInstance.getAudiusLibsTyped()
    // Try to confirm without OTP to force OTP refresh
    try {
      await libs.Account?.confirmCredentials({
        email,
        username: email,
        password: oldPassword
      })
    } catch (e) {
      if (!isOtpMissing(e)) {
        throw e
      }
    }
  }, [email, oldPassword])
  return (
    <ModalForm>
      <ModalContentPages currentPage={page}>
        <ConfirmCredentialsPage />
        <VerifyEmailPage onResendEmailClicked={handleResend} />
        <NewPasswordPage />
        <SuccessPage />
      </ModalContentPages>
      <ModalFooter className={styles.footer}>
        {page === ChangePasswordPage.Success ? (
          <Button fullWidth variant='primary' onClick={onClose} type='button'>
            {messages.done}
          </Button>
        ) : page === ChangePasswordPage.NewPassword ? (
          <Button
            fullWidth
            variant='primary'
            iconRight={IconLock}
            type='submit'
            isLoading={isSubmitting}
            disabled={!isValid || !dirty}
          >
            {messages.changePassword}
          </Button>
        ) : (
          <Button
            fullWidth
            variant='primary'
            iconRight={IconArrowRight}
            type={'submit'}
            isLoading={isSubmitting}
            disabled={!isValid || !dirty}
          >
            {messages.continue}
          </Button>
        )}
      </ModalFooter>
    </ModalForm>
  )
}

type ChangePasswordModalProps = {
  isOpen: boolean
  onClose: () => void
}

type ChangePasswordFormValues = {
  email: string
  oldPassword: string
  password: string
  confirmPassword: string
  otp: string
}

const initialValues: ChangePasswordFormValues = {
  email: '',
  oldPassword: '',
  password: '',
  confirmPassword: '',
  otp: ''
}

const changePasswordFormikSchema = toFormikValidationSchema(passwordSchema)

export const ChangePasswordModal = (props: ChangePasswordModalProps) => {
  const { isOpen, onClose } = props
  const [page, setPage] = useState(ChangePasswordPage.ConfirmCredentials)

  const validationSchema =
    page === ChangePasswordPage.NewPassword
      ? changePasswordFormikSchema
      : undefined

  const handleClosed = useCallback(() => {
    setPage(ChangePasswordPage.ConfirmCredentials)
  }, [setPage])

  const confirmCredentials = useCallback(
    async (values: ChangePasswordFormValues, onError: () => void) => {
      const { email, oldPassword, otp } = values
      const sanitizedOtp = otp.replace(/\s/g, '')
      const libs = await audiusBackendInstance.getAudiusLibsTyped()
      try {
        const confirmed = await libs.Account?.confirmCredentials({
          email,
          username: email,
          password: oldPassword,
          otp: sanitizedOtp
        })
        if (confirmed) {
          setPage(ChangePasswordPage.NewPassword)
        } else {
          onError()
        }
      } catch (e) {
        if (isOtpMissing(e)) {
          setPage(ChangePasswordPage.VerifyEmail)
        } else {
          onError()
        }
      }
    },
    [setPage]
  )

  const changeCredentials = useCallback(
    async (values: ChangePasswordFormValues) => {
      const { email, oldPassword, password } = values
      const libs = await audiusBackendInstance.getAudiusLibsTyped()
      await libs.Account?.changeCredentials({
        newUsername: email,
        newPassword: password,
        oldUsername: email,
        oldPassword
      })
      setPage(ChangePasswordPage.Success)
    },
    [setPage]
  )

  const onSubmit = useCallback(
    async (
      values: ChangePasswordFormValues,
      helpers: FormikHelpers<ChangePasswordFormValues>
    ) => {
      if (page === ChangePasswordPage.ConfirmCredentials) {
        await confirmCredentials(values, () => {
          helpers.setFieldError('oldPassword', messages.invalidCredentials)
        })
      } else if (page === ChangePasswordPage.VerifyEmail) {
        await confirmCredentials(values, () => {
          helpers.setFieldError('otp', messages.invalidCredentials)
        })
      } else {
        await changeCredentials(values)
      }
    },
    [page, confirmCredentials, changeCredentials]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={handleClosed}
      size={'small'}
    >
      <ModalHeader onClose={onClose}>
        <ModalTitle title={messages.changePassword} icon={<IconLock />} />
      </ModalHeader>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        <ChangePasswordModalForm page={page} onClose={onClose} />
      </Formik>
    </Modal>
  )
}
