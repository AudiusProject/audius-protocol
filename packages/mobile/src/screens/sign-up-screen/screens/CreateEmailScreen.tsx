import { useCallback, useMemo } from 'react'

import {
  emailSchema,
  emailSchemaMessages,
  useAudiusQueryContext
} from '@audius/common'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { Dimensions, ImageBackground } from 'react-native'
import RadialGradient from 'react-native-radial-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Box, Flex, Link, Text } from '@audius/harmony-native'
import DJBackground from 'app/assets/images/DJportrait.jpg'
import { Button } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { AudiusValues } from '../components/AudiusValues'
import { SocialMediaLoginOptions } from '../components/SocialMediaLoginOptions'
import { Heading, Page } from '../components/layout'
import { Divider } from '../components/temp-harmony/Divider'
import { Hint } from '../components/temp-harmony/Hint'
import { IconAudiusLogoHorizontalColor } from '../components/temp-harmony/IconAudiusLogoHorizontalColor'
import IconExclamation from '../components/temp-harmony/IconExclamation.svg'
import type { SignUpScreenParamList } from '../types'

const messages = {
  title: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In',
  subHeader: (
    <>
      Join the revolution in music streaming!{'\n'}Discover, connect, and create
      on Audius.
    </>
  ),
  socialsDividerText: 'Or, get started with one of your socials',
  unknownError: 'Unknown error occurred.',
  metaMaskNotRecommended: 'Signing up with MetaMask is not recommended.',
  signUpMetamask: 'Sign Up With MetaMask',
  learnMore: 'Learn More'
}

type SignUpEmailValues = {
  email: string
}

export const CreateEmailScreen = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()
  const existingEmailValue = useSelector(getEmailField)
  const queryContext = useAudiusQueryContext()
  const initialValues = {
    email: existingEmailValue.value ?? ''
  }
  const { color, cornerRadius } = useTheme()
  const emailFormikSchema = useMemo(() => {
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
    <Box h='100%'>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={emailFormikSchema}
      >
        {({ handleSubmit, errors, values }) => (
          <Page
            style={css({
              height: 'auto',
              backgroundColor: color.background.white,
              borderBottomLeftRadius: cornerRadius['2xl'],
              borderBottomRightRadius: cornerRadius['2xl'],
              zIndex: 2
            })}
          >
            <Box alignSelf='center'>
              <IconAudiusLogoHorizontalColor />
            </Box>

            <Heading
              heading={messages.title}
              description={messages.subHeader}
              centered
            />
            <Flex direction='column' gap='l'>
              {/* TODO: replace with harmony text input */}
              <TextField name='email' label={messages.emailLabel} noGutter />
              {errors.email === emailSchemaMessages.emailInUse ? (
                <Hint icon={IconExclamation}>
                  <Text
                    variant='body'
                    size='m'
                    style={css({ textAlign: 'center' })}
                  >
                    {emailSchemaMessages.emailInUse}{' '}
                    <Link
                      to={{
                        screen: 'SignIn',
                        params: { email: values.email }
                      }}
                      color='accentPurple'
                    >
                      {messages.signIn}
                    </Link>
                  </Text>
                </Hint>
              ) : null}
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
              <Text
                variant='body'
                size='m'
                style={css({ textAlign: 'center' })}
              >
                {messages.haveAccount}{' '}
                {/* TODO: Need TextLink equivalent for native harmony? */}
                <Link
                  to={{
                    screen: 'SignIn',
                    params: { email: values.email }
                  }}
                  color='accentPurple'
                >
                  {messages.signIn}
                </Link>
              </Text>
            </Flex>
          </Page>
        )}
      </Formik>
      <Flex
        h='100%'
        w='100%'
        alignItems='center'
        justifyContent='flex-end'
        style={css({
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        })}
      >
        <RadialGradient
          style={{
            // NOTE: Width/Height styles are mandatory for gradient to work. Otherwise it will crash the whole app 🫠
            width: '100%',
            height: '100%',
            position: 'absolute',
            bottom: 0,
            zIndex: 2
          }}
          colors={[
            'rgba(91, 35, 225, 0.8)',
            'rgba(113, 41, 230, 0.64)',
            'rgba(162, 47, 235, 0.5)'
          ]}
          stops={[0, 0.67, 1]}
          radius={Dimensions.get('window').width * 0.77}
        />
        <ImageBackground
          source={DJBackground}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0
          }}
          resizeMode='cover'
        />
        <AudiusValues
          style={css({
            // TODO: match positioning + animation behavior on web
            position: 'absolute',
            bottom: 60,
            zIndex: 3
          })}
        />
      </Flex>
    </Box>
  )
}
