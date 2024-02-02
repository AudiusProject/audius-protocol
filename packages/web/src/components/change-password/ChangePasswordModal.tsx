import { useCallback } from 'react'

import { useChangePasswordFormConfiguration } from '@audius/common/hooks'
import { Button, Flex, IconArrowRight, IconLock, Text } from '@audius/harmony'
import {
  Modal,
  ModalContentPages,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { Formik, useFormikContext } from 'formik'

import { VerifyEmailPage } from 'components/change-email/ChangeEmailModal'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { ModalForm } from 'components/modal-form/ModalForm'
import { EnterPasswordSection } from 'pages/sign-up-page/components/EnterPasswordSection'

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

export enum ChangePasswordPage {
  ConfirmCredentials = 0,
  VerifyEmail = 1,
  NewPassword = 2,
  Success = 3
}

export const ConfirmCredentialsPage = () => {
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.confirmPasswordHelp}</Text>
      <HarmonyTextField
        name='email'
        autoComplete='email'
        label={messages.email}
        autoFocus
      />
      <HarmonyPasswordField name='password' label={messages.currentPassword} />
    </Flex>
  )
}

export const NewPasswordPage = () => {
  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body'>{messages.passwordCompletionHelp}</Text>
      <EnterPasswordSection />
    </Flex>
  )
}

export const SuccessPage = () => {
  return <Text variant={'body'}>{messages.success}</Text>
}

export const ChangePasswordModalForm = ({
  page,
  onClose
}: {
  page: ChangePasswordPage
  onClose: () => void
}) => {
  const { isSubmitting, isValid } = useFormikContext()
  return (
    <ModalForm>
      <ModalContentPages currentPage={page}>
        <ConfirmCredentialsPage />
        <VerifyEmailPage />
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
            disabled={!isValid}
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

export const ChangePasswordModal = (props: ChangePasswordModalProps) => {
  const { isOpen, onClose } = props
  const { page, setPage, ...formConfiguration } =
    useChangePasswordFormConfiguration()

  const handleClosed = useCallback(() => {
    setPage(ChangePasswordPage.ConfirmCredentials)
  }, [setPage])

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
      <Formik {...formConfiguration}>
        <ChangePasswordModalForm page={page} onClose={onClose} />
      </Formik>
    </Modal>
  )
}
