import { useCallback, useContext, useEffect } from 'react'

import {
  ChangeEmailFormValues,
  ChangeEmailPage,
  useChangeEmailFormConfiguration
} from '@audius/common/hooks'
import { Button, Flex, IconArrowRight, Paper, Text } from '@audius/harmony'
import { Form, Formik, useFormikContext } from 'formik'

import {
  ConfirmPasswordPage,
  NewEmailPage,
  VerifyEmailPage
} from 'components/change-email/ChangeEmailModal'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import { ToastContext } from 'components/toast/ToastContext'
import { goBack } from 'utils/navigation'

import { SlidingPages } from './SlidingPages'

const messages = {
  changeYourEmail: 'Change Your Email',
  changeEmail: 'Change Email',
  continue: 'Continue',
  success: 'Email updated!'
}

const ChangeEmailMobileForm = ({ page }: { page: ChangeEmailPage }) => {
  const { isSubmitting } = useFormikContext<ChangeEmailFormValues>()
  return (
    <Flex
      as={Form}
      direction='column'
      justifyContent='space-between'
      css={{ flexGrow: 1 }}
    >
      <Flex p='l' gap='s' direction='column' mt='xl'>
        <Text variant='heading' color='heading'>
          {messages.changeYourEmail}
        </Text>
        <SlidingPages currentPage={page}>
          <ConfirmPasswordPage />
          <NewEmailPage />
          <VerifyEmailPage />
        </SlidingPages>
      </Flex>
      <Paper shadow='midInverted' p='l'>
        <Button
          variant='primary'
          type='submit'
          isLoading={isSubmitting}
          fullWidth
          iconRight={
            page === ChangeEmailPage.VerifyEmail ? undefined : IconArrowRight
          }
        >
          {page === ChangeEmailPage.VerifyEmail
            ? messages.changeEmail
            : messages.continue}
        </Button>
      </Paper>
    </Flex>
  )
}

export const ChangeEmailMobilePage = () => {
  const navContext = useContext(NavContext)!
  const { toast } = useContext(ToastContext)

  useEffect(() => {
    navContext.setLeft(LeftPreset.CLOSE)
    return () => {
      navContext.setLeft(LeftPreset.BACK)
    }
  }, [navContext])

  const onSuccess = useCallback(() => {
    goBack()
    toast(messages.success)
  }, [toast])

  const { page, ...formikConfiguration } =
    useChangeEmailFormConfiguration(onSuccess)

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
        <ChangeEmailMobileForm page={page} />
      </Formik>
    </Flex>
  )
}
