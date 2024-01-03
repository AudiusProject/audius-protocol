import { useCallback, useMemo } from 'react'

import {
  createLoginDetailsSchema,
  useAudiusQueryContext,
  createLoginDetailsPageMessages as messages,
  emailSchemaMessages
} from '@audius/common'
import { css } from '@emotion/native'
import { setValueField } from 'audius-client/src/common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField,
  getIsVerified
} from 'audius-client/src/common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Text, Flex, IconVerified, useTheme } from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { EmailInUseHint } from '../components/EmailInUseHint'
import { PasswordCompletionChecklist } from '../components/PasswordCompletionChecklist'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'
import type { SignUpScreenParamList } from '../types'

export type CreateLoginDetailsValues = {
  email: string
  password: string
  confirmPassword: string
}

export const CreateLoginDetailsScreen = () => {
  const dispatch = useDispatch()
  const handleField = useSelector(getHandleField)
  const existingEmailValue = useSelector(getEmailField)
  const isVerified = useSelector(getIsVerified)
  const navigation = useNavigation<SignUpScreenParamList>()
  const { spacing } = useTheme()

  const initialValues = {
    email: existingEmailValue.value ?? '',
    password: '',
    confirmPassword: ''
  }

  const handleSubmit = useCallback(
    (values: CreateLoginDetailsValues) => {
      const { email, password } = values
      dispatch(setValueField('email', email))
      dispatch(setValueField('password', password))
      navigation.navigate('FinishProfile')
    },
    [dispatch, navigation]
  )

  const audiusQueryContext = useAudiusQueryContext()

  const loginDetailsFormikSchema = useMemo(
    () =>
      toFormikValidationSchema(createLoginDetailsSchema(audiusQueryContext)),
    [audiusQueryContext]
  )

  const navigateToLogin = () => {
    navigation.navigate('SignOn', { screen: 'sign-in' })
  }
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={loginDetailsFormikSchema}
    >
      {({ isValid, dirty, errors }) => (
        <Page>
          <Heading
            heading={messages.title}
            description={messages.description}
          />
          <Flex direction='column' h='100%' gap='l'>
            <Flex direction='column' gap='l'>
              <ReadOnlyField
                label={messages.handleLabel}
                value={
                  <Flex gap='xs'>
                    <Text variant='body' size='m' color='default'>
                      @{handleField.value}
                      {isVerified ? (
                        <IconVerified
                          style={css({
                            height: spacing.unit3,
                            width: spacing.unit3
                          })}
                        />
                      ) : null}
                    </Text>
                  </Flex>
                }
              />
              <TextField label={messages.emailLabel} name='email' noGutter />
              {errors.email === emailSchemaMessages.emailInUse ? (
                <EmailInUseHint onChangeScreen={navigateToLogin} />
              ) : null}
              <TextField
                name='password'
                label={messages.passwordLabel}
                textContentType='password'
                secureTextEntry
                noGutter
              />
              <TextField
                name='confirmPassword'
                label={messages.confirmPasswordLabel}
                textContentType='password'
                secureTextEntry
                noGutter
              />
              <PasswordCompletionChecklist />
            </Flex>
          </Flex>
          <PageFooter
            shadow='flat'
            prefix={<SignUpAgreementText />}
            buttonProps={{
              disabled: !(
                (dirty || (initialValues.email && initialValues.password)) &&
                isValid
              )
            }}
          />
        </Page>
      )}
    </Formik>
  )
}
