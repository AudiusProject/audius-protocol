import { useState, useRef, useEffect, useCallback } from 'react'

import { accountSelectors } from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  getPasswordField,
  getEmailField,
  getStatus,
  getOtpField
} from 'common/store/pages/signon/selectors'
import type { EditableField } from 'common/store/pages/signon/types'
import querystring from 'query-string'
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import RadialGradient from 'react-native-radial-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector, useDispatch } from 'react-redux'

import backgImage from 'app/assets/images/DJportrait.jpg'
import audiusLogoHorizontal from 'app/assets/images/Horizontal-Logo-Full-Color-Deprecated.png'
import IconArrow from 'app/assets/images/iconArrow.svg'
import ValidationIconX from 'app/assets/images/iconValidationX.svg'
import signupCTA from 'app/assets/images/signUpCTA.png'
import Button from 'app/components/button'
import LoadingSpinner from 'app/components/loading-spinner'
import useAppState from 'app/hooks/useAppState'
import { useToast } from 'app/hooks/useToast'
import { screen, track, make } from 'app/services/analytics'
import { setVisibility } from 'app/store/drawers/slice'
import { EventNames } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import type { SignOnStackParamList } from './types'

const { getAccountUser } = accountSelectors
const image = backgImage
const defaultBorderColor = '#F2F2F4'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    zIndex: 2,
    backgroundColor: 'white',
    justifyContent: 'space-between'
  },
  containerForm: {
    transform: [
      {
        translateY: 0
      }
    ],
    width: '100%',
    zIndex: 5,
    backgroundColor: 'white',
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 40,
    padding: 50
  },
  drawerContent: { width: '100%', alignItems: 'center' },
  containerBack: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: -100,
    bottom: 0,
    width: '100%',
    zIndex: 3,
    backgroundColor: 'white'
  },
  image: {
    flex: 1,
    height: '100%'
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    top: '40%',
    zIndex: 5
  },
  title: {
    color: '#7E1BCC',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold',
    lineHeight: 22,
    textAlign: 'center',
    paddingTop: 32,
    paddingBottom: 6
  },
  header: {
    color: '#7E1BCC',
    fontSize: 14,
    lineHeight: 16,
    fontFamily: 'AvenirNextLTPro-DemiBold',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3
  },
  audiusLogoHorizontal: {
    width: 194,
    height: 51,
    marginTop: 24
  },
  containerCTA: {
    zIndex: 4,
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  signupCTAContainer: {
    flexGrow: 1
  },
  signupCTA: {
    marginTop: 32,
    marginBottom: 16,
    resizeMode: 'contain',
    width: undefined,
    height: undefined,
    flex: 1
  },
  bottomButtons: {
    marginTop: 16,
    height: 80
  },
  input: {
    height: 42,
    width: '100%',
    marginTop: 32,
    paddingLeft: 16,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: defaultBorderColor,
    backgroundColor: '#FCFCFC',
    borderRadius: 4,
    padding: 10,
    color: '#858199',
    fontFamily: 'AvenirNextLTPro-DemiBold',
    fontSize: 16
  },
  inputPass: {
    height: 42,
    width: '100%',
    paddingLeft: 16,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: defaultBorderColor,
    backgroundColor: '#FCFCFC',
    borderRadius: 4,
    textAlignVertical: 'center',
    justifyContent: 'center',
    marginTop: 16,
    color: '#858199',
    fontFamily: 'AvenirNextLTPro-DemiBold',
    fontSize: 16
  },
  formBtn: {
    flexDirection: 'row',
    marginTop: 32,
    height: 48,
    width: '100%',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#CC0FE0',
    borderRadius: 4
  },
  formButtonTitleContainer: {
    width: '100%'
  },
  mainButtonContainer: {
    width: '100%'
  },
  mainButton: {
    padding: 12
  },
  arrowIcon: {
    height: 20,
    width: 20
  },
  loadingIcon: {
    width: 24,
    height: 24
  },
  switchFormBtn: {
    width: '100%',
    alignItems: 'center'
  },
  switchFormBtnTitle: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Medium'
  },
  forgotPasswordButton: {
    padding: 6,
    alignItems: 'center',
    marginTop: 16
  },
  forgotPasswordButtonTitle: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Medium',
    textDecorationLine: 'underline'
  },
  errorText: {
    flex: 1,
    color: '#E03D51',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Regular',
    alignSelf: 'center'
  },
  errorIcon: {
    flex: 1,
    width: 12,
    height: 12,
    marginRight: 10,
    alignSelf: 'center'
  },
  errorArrow: {
    height: 12,
    width: 12,
    alignSelf: 'center'
  },
  errorContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingLeft: 10,
    margin: 0
  },
  errorButton: {
    padding: 0,
    margin: 0,
    width: '100%'
  }
})

const messages = {
  title: 'Sign Up For Audius',
  header1: 'Stream the music you love.',
  header2: 'Support the artists you care about.',
  signinDescription: 'Sign Into Your Audius Account',
  signUp: 'Sign Up',
  signIn: 'Sign In',
  newToAudius: 'New to Audius?',
  createAccount: 'Create an Account',
  hasAccountAlready: 'Already have an account?',
  forgotPassword: 'Forgot your password?',
  error: 'Something went wrong, please try again later'
}

const errorMessages = {
  invalidEmail: 'Please enter a valid email',
  emptyPassword: 'Please enter a password',
  requiresOtp: 'Enter the verification code sent to your email',
  default: 'Invalid Credentials'
}

let lastIsSignin = false
let errorOpacity = new Animated.Value(0)

const FormTitle = ({ isSignin }: { isSignin: boolean }) => {
  let opacity = new Animated.Value(1)

  // fade the header out and in when switch between signup and signin
  if (lastIsSignin !== isSignin) {
    opacity = new Animated.Value(0)
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      lastIsSignin = isSignin
    })
  }
  if (isSignin) {
    return (
      <Animated.Text style={[styles.title, { opacity }]}>
        {messages.signinDescription}
      </Animated.Text>
    )
  } else {
    return (
      <Animated.View style={{ opacity }}>
        <Text style={styles.title}>{messages.title}</Text>
        <Text style={styles.header}>{messages.header1}</Text>
        <Text style={styles.header}>{messages.header2}</Text>
      </Animated.View>
    )
  }
}

const isValidEmailString = (email: string) => {
  const emailRe =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailRe.test(String(email).toLowerCase())
}

type SignOnProps = NativeStackScreenProps<SignOnStackParamList, 'SignOn'>
const SignOn = ({ navigation }: SignOnProps) => {
  const dispatch = useDispatch()

  const [isWorking, setIsWorking] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignin, setisSignIn] = useState(false)
  const [emailBorderColor, setEmailBorderColor] = useState(defaultBorderColor)
  const [passBorderColor, setPassBorderColor] = useState(defaultBorderColor)
  const [otpBorderColor, setOtpBorderColor] = useState(defaultBorderColor)
  const [formButtonMarginTop, setFormButtonMarginTop] = useState(28)
  const [attemptedEmail, setAttemptedEmail] = useState(false)
  const [attemptedPassword, setAttemptedPassword] = useState(false)
  const [showInvalidEmailError, setShowInvalidEmailError] = useState(false)
  const [showEmptyPasswordError, setShowEmptyPasswordError] = useState(false)

  const signOnStatus = useSelector(getStatus)
  const passwordField: EditableField = useSelector(getPasswordField)
  const emailField: EditableField = useSelector(getEmailField)
  const otpField: EditableField = useSelector(getOtpField)
  const accountUser = useSelector(getAccountUser)

  const signedIn = signOnStatus === 'success'
  const signInError = passwordField.error
  const requiresOtp = signInError.includes('403')
  const emailIsValid = emailField.error !== 'characters'

  const topDrawer = useRef(new Animated.Value(-800)).current
  const animateDrawer = useCallback(() => {
    Animated.timing(topDrawer, {
      toValue: 0,
      duration: 880,
      delay: 500,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true
    }).start()
  }, [topDrawer])

  const opacityCTA = useRef(new Animated.Value(0)).current
  const fadeCTA = useCallback(() => {
    Animated.timing(opacityCTA, {
      toValue: 1,
      duration: 500,
      delay: 1200,
      useNativeDriver: true
    }).start()
  }, [opacityCTA])

  // Record screen view
  useEffect(() => {
    screen({
      route: `/${isSignin ? 'signin' : 'signup'}`
    })
  }, [isSignin])

  useEffect(() => {
    setShowInvalidEmailError(attemptedEmail && !emailIsValid)
  }, [attemptedEmail, emailIsValid])

  useEffect(() => {
    setShowEmptyPasswordError(attemptedPassword && password === '')
  }, [attemptedPassword, password])

  useEffect(() => {
    if (signInError && isWorking) {
      setIsWorking(false)
    }
  }, [signInError, isWorking])

  useEffect(() => {
    if (signedIn && accountUser) {
      setIsWorking(false)

      // Debounce resetting state
      const timeout = setTimeout(() => {
        setEmail('')
        setPassword('')
      }, 1000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [signedIn, accountUser, dispatch])

  useEffect(() => {
    animateDrawer()
    fadeCTA()
  }, [animateDrawer, fadeCTA])

  useEffect(() => {
    if (
      (isSignin && signInError) ||
      requiresOtp ||
      showInvalidEmailError ||
      showEmptyPasswordError
    ) {
      // fade in the error message
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start()
    } else {
      errorOpacity = new Animated.Value(0)
    }
  }, [
    isSignin,
    signInError,
    requiresOtp,
    email,
    showInvalidEmailError,
    showEmptyPasswordError
  ])

  const processReferrerFromClipboard = useCallback(async () => {
    const hasURL = await Clipboard.hasURL()
    if (hasURL !== false) {
      const contents = await Clipboard.getString()
      if (contents) {
        const parsed = querystring.parseUrl(contents)
        const handle = parsed.query?.ref as string
        if (handle) {
          dispatch(signOnActions.fetchReferrer(handle))
        }
      }
    }
  }, [dispatch])

  useEffect(() => {
    processReferrerFromClipboard()
  }, [processReferrerFromClipboard])
  useAppState(
    () => {
      processReferrerFromClipboard()
    },
    () => {}
  )

  const { staticWhite } = useThemeColors()

  const errorView = () => {
    if (isSignin && requiresOtp) {
      return (
        <Animated.View
          style={[styles.errorContainer, { opacity: errorOpacity }]}
        >
          <ValidationIconX style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessages.requiresOtp}</Text>
        </Animated.View>
      )
    } else if (isSignin && signInError) {
      return (
        <Animated.View
          style={[styles.errorContainer, { opacity: errorOpacity }]}
        >
          <ValidationIconX style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessages.default}</Text>
        </Animated.View>
      )
    }
    if (showInvalidEmailError) {
      return (
        <Animated.View
          style={[styles.errorContainer, { opacity: errorOpacity }]}
        >
          <ValidationIconX style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessages.invalidEmail}</Text>
        </Animated.View>
      )
    }
    if (showEmptyPasswordError) {
      return (
        <Animated.View
          style={[styles.errorContainer, { opacity: errorOpacity }]}
        >
          <ValidationIconX style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessages.emptyPassword}</Text>
        </Animated.View>
      )
    }
    return (
      <View style={styles.errorContainer}>
        <ValidationIconX style={[styles.errorIcon, { opacity: 0 }]} />
        <Text />
      </View>
    )
  }

  const renderFormSwitchButton = () => {
    return (
      <Text style={styles.switchFormBtnTitle}>
        {isSignin ? `${messages.newToAudius}` : `${messages.hasAccountAlready}`}
        &nbsp;
        <Text style={{ textDecorationLine: 'underline' }}>
          {isSignin ? `${messages.createAccount}` : `${messages.signIn}`}
        </Text>
      </Text>
    )
  }

  const renderForgotPasswordButton = () => {
    return (
      <Text style={styles.forgotPasswordButtonTitle}>
        {messages.forgotPassword}
      </Text>
    )
  }

  const switchForm = () => {
    if (!isWorking) {
      if (isSignin) {
        setFormButtonMarginTop(28)
        track(
          make({
            eventName: EventNames.CREATE_ACCOUNT_OPEN,
            source: 'sign in page'
          })
        )
      } else {
        setFormButtonMarginTop(14)
        track(
          make({
            eventName: EventNames.SIGN_IN_OPEN,
            source: 'sign up page'
          })
        )
      }

      setShowInvalidEmailError(false)
      setAttemptedEmail(false)
      setShowEmptyPasswordError(false)
      setAttemptedPassword(false)
      setisSignIn(!isSignin)
      Keyboard.dismiss()
    }
  }

  const passwordInputField = () => {
    if (isSignin) {
      return (
        <TextInput
          style={[styles.inputPass, { borderColor: passBorderColor }]}
          placeholderTextColor='#C2C0CC'
          underlineColorAndroid='transparent'
          placeholder='Password'
          autoComplete='off'
          autoCorrect={false}
          autoCapitalize='none'
          enablesReturnKeyAutomatically={true}
          maxLength={100}
          textContentType='password'
          secureTextEntry={true}
          onChangeText={(newText) => {
            setAttemptedPassword(true)
            setPassword(newText)
            dispatch(signOnActions.setValueField('password', newText))
          }}
          onFocus={() => {
            setPassBorderColor('#7E1BCC')
          }}
          onBlur={() => {
            setPassBorderColor(defaultBorderColor)
          }}
        />
      )
    }
    return <></>
  }

  const otpInputField = () => {
    return (
      <TextInput
        style={[styles.inputPass, { borderColor: otpBorderColor }]}
        placeholderTextColor='#C2C0CC'
        underlineColorAndroid='transparent'
        placeholder='Verification Code'
        autoComplete='off'
        autoCorrect={false}
        autoCapitalize='characters'
        enablesReturnKeyAutomatically={true}
        maxLength={6}
        inputMode='numeric'
        textContentType='oneTimeCode'
        onChangeText={(newText) => {
          dispatch(signOnActions.setValueField('otp', newText))
        }}
        onFocus={() => {
          setOtpBorderColor('#7E1BCC')
        }}
        onBlur={() => {
          setOtpBorderColor(defaultBorderColor)
        }}
      />
    )
  }

  const MainButton = ({
    isSignin,
    isWorking
  }: {
    isSignin: boolean
    isWorking: boolean
  }) => {
    let opacity = new Animated.Value(1)

    const { toast } = useToast()

    // fade the sign up/in button out and in when switch between signup and signin
    if (lastIsSignin !== isSignin) {
      opacity = new Animated.Value(0)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start(() => {
        lastIsSignin = isSignin
      })
    }

    return (
      <Animated.View style={[styles.formButtonTitleContainer, { opacity }]}>
        <Button
          title={isSignin ? messages.signIn : messages.signUp}
          onPress={() => {
            Keyboard.dismiss()
            setAttemptedEmail(true)
            if (isValidEmailString(email)) {
              if (isSignin) {
                setAttemptedPassword(true)
                if (password === '') {
                  setShowEmptyPasswordError(true)
                } else {
                  signIn()
                  dispatch(signOnActions.setValueField('password', password))
                  setIsWorking(true)
                }
              } else {
                setIsWorking(true)
                dispatch(
                  signOnActions.checkEmail(
                    email,
                    () => {
                      // On available email, move to create password
                      dispatch(signOnActions.startSignUp())
                      navigation.push('CreatePassword')
                      setIsWorking(false)
                    },
                    () => {
                      // On unavailable email (e.g. user exists with that email),
                      // Switch to the sign in form
                      switchForm()
                      setIsWorking(false)
                    },
                    () => {
                      // On any unknown error, toast and let the user try again
                      // This could be due to the user being blocked by CloudFlare
                      toast({ content: messages.error })
                      setIsWorking(false)
                    }
                  )
                )
              }
            } else {
              setShowInvalidEmailError(true)
            }
          }}
          disabled={isWorking}
          containerStyle={{
            ...styles.mainButtonContainer,
            marginTop: formButtonMarginTop
          }}
          style={styles.mainButton}
          icon={
            isWorking ? (
              <LoadingSpinner style={styles.loadingIcon} color={staticWhite} />
            ) : (
              <IconArrow style={styles.arrowIcon} fill='white' />
            )
          }
          ignoreDisabledStyle
        />
      </Animated.View>
    )
  }

  const validateEmail = (email: string) => {
    dispatch(signOnActions.setValueField('email', email))
    dispatch(signOnActions.validateEmail(email))
  }

  const signIn = () => {
    setIsWorking(true)
    dispatch(signOnActions.signIn(email, password, otpField.value))
  }

  const insets = useSafeAreaInsets()

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.containerBack}>
          <RadialGradient
            style={styles.gradient}
            colors={[
              'rgba(91, 35, 225, 0.8)',
              'rgba(113, 41, 230, 0.640269)',
              'rgba(162, 47, 235, 0.5)'
            ]}
            stops={[0.1, 0.67, 1]}
            radius={Dimensions.get('window').width / 1.2}
          />
          <ImageBackground
            source={image}
            resizeMode='cover'
            style={styles.image}
          />
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <Animated.View
            style={[
              styles.containerForm,
              { transform: [{ translateY: topDrawer }] }
            ]}
          >
            <View style={styles.drawerContent}>
              <Image
                source={audiusLogoHorizontal}
                style={styles.audiusLogoHorizontal}
              />
              <FormTitle isSignin={isSignin} />
              <TextInput
                style={[styles.input, { borderColor: emailBorderColor }]}
                placeholderTextColor='#C2C0CC'
                underlineColorAndroid='transparent'
                placeholder='Email'
                keyboardType='email-address'
                autoComplete='off'
                autoCorrect={false}
                autoCapitalize='none'
                enablesReturnKeyAutomatically={true}
                maxLength={100}
                textContentType='emailAddress'
                onChangeText={(newText) => {
                  const newEmail = newText.trim()
                  setEmail(newEmail)
                  if (newEmail !== '') {
                    validateEmail(newEmail)
                  }
                }}
                onFocus={() => {
                  setEmailBorderColor('#7E1BCC')
                }}
                onBlur={() => {
                  setEmailBorderColor(defaultBorderColor)
                  if (email !== '') {
                    setShowInvalidEmailError(!isValidEmailString(email))
                    // wait a bit for email validation to come back
                    setTimeout(() => setAttemptedEmail(true), 1000)
                  }
                }}
              />
              {passwordInputField()}
              {errorView()}
              {requiresOtp ? otpInputField() : null}
              <MainButton isWorking={isWorking} isSignin={isSignin} />
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.containerCTA,
            {
              opacity: opacityCTA
            }
          ]}
        >
          {Dimensions.get('window').height < 720 ? (
            <></>
          ) : (
            <View style={styles.signupCTAContainer}>
              <Image source={signupCTA} style={styles.signupCTA} />
            </View>
          )}

          <View style={[styles.bottomButtons, { marginBottom: insets.bottom }]}>
            <TouchableOpacity
              style={styles.switchFormBtn}
              activeOpacity={0.6}
              onPress={switchForm}
            >
              {renderFormSwitchButton()}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              activeOpacity={0.6}
              onPress={() => {
                dispatch(
                  setVisibility({ drawer: 'ForgotPassword', visible: true })
                )
              }}
            >
              {renderForgotPasswordButton()}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default SignOn
