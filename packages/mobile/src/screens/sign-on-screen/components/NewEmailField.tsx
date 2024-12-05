import { useCallback, useEffect } from 'react'

import {
  confirmEmailMessages,
  createEmailPageMessages
} from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { TEMPORARY_PASSWORD } from '@audius/common/utils'
import {
  setField,
  setValueField,
  signIn
} from 'common/store/pages/signon/actions'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { Hint, IconError, TextLink } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import type { SignUpScreenParamList } from '../types'

import { EmailField, type EmailFieldProps } from './EmailField'
import type { EmailInUseHintProps } from './EmailInUseHint'

type NewEmailFieldProps = EmailFieldProps & EmailInUseHintProps

export const NewEmailField = (props: NewEmailFieldProps) => {
  const dispatch = useDispatch()
  const { onChangeScreen, ...other } = props
  const { name } = other

  const navigation = useNavigation<SignUpScreenParamList>()
  const [{ value: email }, { error }] = useField(name)
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  const isGuest = error === emailSchemaMessages.completeYourProfile
  const hasError = emailInUse || isGuest

  // Track which specific error was shown last
  const lastShownError = usePrevious(error)

  useEffect(() => {
    dispatch(setField('isGuest', isGuest))
  }, [dispatch, isGuest])

  const handlePressConfirmEmail = useCallback(() => {
    dispatch(setValueField('email', email))
    dispatch(setValueField('password', TEMPORARY_PASSWORD))
    dispatch(signIn(email, TEMPORARY_PASSWORD))
    navigation.navigate('ConfirmEmail')
  }, [dispatch, email, navigation])

  const showGuestError =
    isGuest ||
    (isValidating && lastShownError === emailSchemaMessages.completeYourProfile)

  const showEmailInUseError =
    emailInUse ||
    (isValidating && lastShownError === emailSchemaMessages.emailInUse)

  return (
    <>
      <EmailField
        {...props}
        error={hasError ? false : undefined}
        helperText={hasError ? false : undefined}
      />
      {showGuestError ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.completeYourProfile}{' '}
          <TextLink variant='visible' onPress={handlePressConfirmEmail}>
            {confirmEmailMessages.title}
          </TextLink>
        </Hint>
      ) : showEmailInUseError ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.emailInUse}{' '}
          <TextLink variant='visible' onPress={() => onChangeScreen('sign-in')}>
            {createEmailPageMessages.signIn}
          </TextLink>
        </Hint>
      ) : null}
    </>
  )
}
