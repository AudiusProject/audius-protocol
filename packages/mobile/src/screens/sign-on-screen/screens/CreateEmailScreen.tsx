import { useCallback, useMemo } from 'react'

import {
  emailSchema,
  useAudiusQueryContext,
  createEmailPageMessages as messages
} from '@audius/common'
import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Flex, Text } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { NewEmailField } from '../components/NewEmailField'
import { SocialMediaLoginOptions } from '../components/SocialMediaLoginOptions'
import { Heading } from '../components/layout'
import { Divider } from '../components/temp-harmony/Divider'
import type { SignUpScreenParamList } from '../types'

import type { SignOnScreenProps } from './types'

type SignUpEmailValues = {
  email: string
}

export const CreateEmailScreen = (props: SignOnScreenProps) => {
  const { email, onChangeEmail, onChangeScreen } = props
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()
  const existingEmailValue = useSelector(getEmailField) || email
  const queryContext = useAudiusQueryContext()
  const initialValues = {
    email: existingEmailValue.value ?? ''
  }
  const EmailSchema = useMemo(() => {
    return toFormikValidationSchema(emailSchema(queryContext))
  }, [queryContext])

  const handleSubmit = useCallback(
    (values: SignUpEmailValues) => {
      const { email } = values
      dispatch(setValueField('email', email))
      navigation.navigate('CreatePassword', { email })
    },
    [dispatch, navigation]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={EmailSchema}
      validateOnChange={false}
    >
      {({ handleSubmit }) => (
        <>
          <Heading
            heading={messages.title}
            description={
              <>
                {messages.subHeader.line1}
                {'\n'}
                {messages.subHeader.line2}
              </>
            }
            centered
          />
          <Flex direction='column' gap='l'>
            <NewEmailField
              name='email'
              label={messages.emailLabel}
              noGutter
              onChangeText={onChangeEmail}
              onChangeScreen={onChangeScreen}
            />
            <Divider>
              <Text variant='body' size='s' color='subdued'>
                {messages.socialsDividerText}
              </Text>
            </Divider>
            <SocialMediaLoginOptions />
          </Flex>
          <Flex direction='column' gap='l'>
            <Button
              title={messages.signUp}
              onPress={() => handleSubmit()}
              fullWidth
            />
            <Text variant='body' size='m' textAlign='center'>
              {messages.haveAccount}{' '}
              {/* TODO: Need TextLink equivalent for native harmony? */}
              <Text onPress={() => onChangeScreen('sign-in')} color='accent'>
                {messages.signIn}
              </Text>
            </Text>
          </Flex>
        </>
      )}
    </Formik>
  )
}
