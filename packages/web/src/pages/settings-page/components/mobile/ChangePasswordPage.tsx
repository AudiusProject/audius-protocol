import { useCallback, useContext, useEffect } from 'react'

import {
  ChangePasswordFormValues,
  ChangePasswordPage,
  useChangePasswordFormConfiguration
} from '@audius/common/hooks'
import {
  Button,
  Flex,
  IconArrowRight,
  IconLock,
  Paper,
  Text
} from '@audius/harmony'
import { Form, Formik, useFormikContext } from 'formik'

import { VerifyEmailPage } from 'components/change-email/ChangeEmailModal'
import {
  ConfirmCredentialsPage,
  NewPasswordPage,
  SuccessPage
} from 'components/change-password/ChangePasswordModal'
import NavContext, { LeftPreset } from 'components/nav/store/context'

import { SettingsPageProps } from './SettingsPage'
import { SlidingPages } from './SlidingPages'

const messages = {
  changeYourPassword: 'Change Your Password',
  changePassword: 'Change Password',
  continue: 'Continue',
  close: 'Close'
}

const ChangePasswordMobileForm = ({
  page,
  onClose
}: {
  page: ChangePasswordPage
  onClose: () => void
}) => {
  const { isSubmitting, isValid } = useFormikContext<ChangePasswordFormValues>()
  return (
    <Flex
      as={Form}
      direction={'column'}
      justifyContent='space-between'
      css={{ flexGrow: 1 }}
    >
      <Flex p='l' gap={'s'} direction='column' mt={'xl'}>
        <Text variant='heading' color='heading'>
          {messages.changeYourPassword}
        </Text>
        <SlidingPages currentPage={page}>
          <ConfirmCredentialsPage />
          <VerifyEmailPage />
          <NewPasswordPage />
          <SuccessPage />
        </SlidingPages>
      </Flex>
      <Paper shadow={'midInverted'} p={'l'}>
        {page === ChangePasswordPage.Success ? (
          <Button fullWidth variant='primary' onClick={onClose} type='button'>
            {messages.close}
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
      </Paper>
    </Flex>
  )
}

export const ChangePasswordMobilePage = ({ goBack }: SettingsPageProps) => {
  const navContext = useContext(NavContext)!

  useEffect(() => {
    navContext.setLeft(LeftPreset.CLOSE)
    return () => {
      navContext.setLeft(LeftPreset.BACK)
    }
  }, [navContext])

  // Go back to account settings when done
  const onComplete = useCallback(() => {
    goBack()
  }, [goBack])

  const { page, ...formikConfiguration } = useChangePasswordFormConfiguration()

  return (
    <Flex
      direction='column'
      css={{
        textAlign: 'start',
        backgroundColor: 'white',
        height: 'calc(100% - 50px)'
      }}
    >
      <Formik {...formikConfiguration}>
        <ChangePasswordMobileForm page={page} onClose={onComplete} />
      </Formik>
    </Flex>
  )
}
