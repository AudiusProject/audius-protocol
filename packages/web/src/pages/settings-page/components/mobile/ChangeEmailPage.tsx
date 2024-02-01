import { useCallback, useContext, useEffect } from 'react'

import {
  ChangeEmailFormValues,
  ChangeEmailPage,
  useChangeEmailFormConfiguration
} from '@audius/common/hooks'
import {
  Button,
  Flex,
  Hint,
  IconArrowRight,
  IconInfo,
  Paper,
  Text
} from '@audius/harmony'
import { Form, Formik, useFormikContext } from 'formik'

import {
  ConfirmPasswordPage,
  NewEmailPage,
  VerifyEmailPage,
  SuccessPage
} from 'components/change-email/ChangeEmailModal'
import NavContext, { LeftPreset } from 'components/nav/store/context'

import { SettingsPageProps } from './SettingsPage'
import { SlidingPages } from './SlidingPages'

const messages = {
  changeYourEmail: 'Change Your Email',
  changeEmail: 'Change Email',
  emailUpdated: 'Email Updated!',
  continue: 'Continue',
  close: 'Close',
  note: 'Note: ',
  successNote:
    'Use this email to sign in and receive email notifications from Audius.'
}

const ChangeEmailMobileForm = ({
  page,
  onClose
}: {
  page: ChangeEmailPage
  onClose: () => void
}) => {
  const { isSubmitting } = useFormikContext<ChangeEmailFormValues>()
  return (
    <Flex
      as={Form}
      direction={'column'}
      justifyContent='space-between'
      css={{ flexGrow: 1 }}
    >
      <Flex p='l' gap={'s'} direction='column' mt={'xl'}>
        <Text variant='heading' color='heading'>
          {page === ChangeEmailPage.Success
            ? messages.emailUpdated
            : messages.changeYourEmail}
        </Text>
        <SlidingPages currentPage={page}>
          <ConfirmPasswordPage />
          <NewEmailPage />
          <VerifyEmailPage />
          <Flex gap={'2xl'} direction='column'>
            <SuccessPage />
            <Hint icon={IconInfo}>
              <Text asChild strength='strong'>
                <span>{messages.note}</span>
              </Text>
              {messages.successNote}
            </Hint>
          </Flex>
        </SlidingPages>
      </Flex>
      <Paper shadow={'midInverted'} p={'l'}>
        {page === ChangeEmailPage.Success ? (
          <Button fullWidth variant='primary' onClick={onClose} type='button'>
            {messages.close}
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

export const ChangeEmailMobilePage = ({ goBack }: SettingsPageProps) => {
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

  const { page, ...formikConfiguration } = useChangeEmailFormConfiguration()

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
        <ChangeEmailMobileForm page={page} onClose={onComplete} />
      </Formik>
    </Flex>
  )
}
