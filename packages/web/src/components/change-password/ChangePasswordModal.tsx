import { useCallback, useContext } from 'react'

import {
  ChangePasswordFormValues,
  ChangePasswordPage,
  useHarmonyField,
  useChangePasswordFormConfiguration
} from '@audius/common/hooks'
import {
  PasswordInput,
  TextInput,
  Modal,
  ModalContentPages,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Flex,
  IconArrowRight,
  IconLock,
  Text
} from '@audius/harmony'
import { Formik, useFormikContext } from 'formik'

import { VerifyEmailPage } from 'components/change-email/ChangeEmailModal'
import { ModalForm } from 'components/modal-form/ModalForm'
import { ToastContext } from 'components/toast/ToastContext'
import { PasswordCompletionChecklist } from 'pages/sign-up-page/components/PasswordCompletionChecklist'

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
  success: 'Password updated!',
  password: 'Password',
  confirmPassword: 'Confirm Password'
}

export const ConfirmCredentialsPage = () => {
  const [emailField] = useHarmonyField('email')
  const [passwordField] = useHarmonyField('password')
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.confirmPasswordHelp}</Text>
      <TextInput
        {...emailField}
        label={messages.email}
        autoComplete='email'
        autoFocus
      />
      <PasswordInput
        {...passwordField}
        label={messages.currentPassword}
        autoComplete='current-password'
      />
    </Flex>
  )
}

export const NewPasswordPage = () => {
  const [passwordField] = useHarmonyField('password')
  const [confirmPasswordField] = useHarmonyField('confirmPassword')
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.passwordCompletionHelp}</Text>
      <Flex direction='column' gap='l'>
        <PasswordInput
          {...passwordField}
          label={messages.password}
          helperText={undefined}
          autoComplete='new-password'
        />
        <PasswordInput
          {...confirmPasswordField}
          label={messages.confirmPassword}
          helperText={undefined}
          autoComplete='new-password'
        />
        <PasswordCompletionChecklist />
      </Flex>
    </Flex>
  )
}

export const ChangePasswordModalForm = ({
  page
}: {
  page: ChangePasswordPage
}) => {
  const { isSubmitting } = useFormikContext<ChangePasswordFormValues>()
  return (
    <ModalForm>
      <ModalContentPages currentPage={page}>
        <ConfirmCredentialsPage />
        <VerifyEmailPage />
        <NewPasswordPage />
      </ModalContentPages>
      <ModalFooter className={styles.footer}>
        <Button
          fullWidth
          variant='primary'
          iconRight={
            page === ChangePasswordPage.NewPassword ? IconLock : IconArrowRight
          }
          type='submit'
          isLoading={isSubmitting}
        >
          {page === ChangePasswordPage.NewPassword
            ? messages.changePassword
            : messages.continue}
        </Button>
      </ModalFooter>
    </ModalForm>
  )
}

type ChangePasswordModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const ChangePasswordModal = (props: ChangePasswordModalProps) => {
  const { isOpen, onClose } = props
  const { toast } = useContext(ToastContext)

  const onComplete = useCallback(() => {
    onClose()
    toast(messages.success)
  }, [toast, onClose])

  const { page, setPage, ...formConfiguration } =
    useChangePasswordFormConfiguration(onComplete)

  const handleClosed = useCallback(() => {
    setPage(ChangePasswordPage.ConfirmCredentials)
  }, [setPage])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={handleClosed}
      size='small'
    >
      <ModalHeader onClose={onClose}>
        <ModalTitle title={messages.changePassword} icon={<IconLock />} />
      </ModalHeader>
      <Formik {...formConfiguration}>
        <ChangePasswordModalForm page={page} />
      </Formik>
    </Modal>
  )
}
