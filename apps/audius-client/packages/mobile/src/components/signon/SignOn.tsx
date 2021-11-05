import { NativeStackScreenProps } from '@react-navigation/native-stack'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { useDispatch, useSelector } from 'react-redux'
import backgImage from '../../assets/images/DJportrait.jpg'
import audiusLogoHorizontal from '../../assets/images/Horizontal-Logo-Full-Color.png'
import IconArrow from '../../assets/images/iconArrow.svg'
import ValidationIconX from '../../assets/images/iconValidationX.svg'
import signupCTA from '../../assets/images/signUpCTA.png'
import Button from '../../components/button'
import { remindUserToTurnOnNotifications } from '../../components/notification-reminder/NotificationReminder'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'
import { MessageType } from '../../message/types'
import { setVisibility } from '../../store/drawers/slice'
import { getDappLoaded, getIsSignedIn } from '../../store/lifecycle/selectors'
import * as signonActions from '../../store/signon/actions'
import {
  getEmailIsAvailable,
  getEmailIsValid,
  getEmailStatus,
  getIsSigninError
} from '../../store/signon/selectors'
import { EventNames } from '../../types/analytics'
import { make, track } from '../../utils/analytics'
import { RootStackParamList } from './NavigationStack'

const image = backgImage
const windowWidth = Dimensions.get('window').width
const defaultBorderColor = '#F2F2F4'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    zIndex: 2,
    backgroundColor: 'white',
    justifyContent: 'space-evenly'
  },
  containerForm: {
    position: 'absolute',
    transform: [
      {
        translateY: 0
      }
    ],
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 5,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 40,
    padding: 28,
    paddingBottom: 38,
    paddingTop: 80
  },

  containerCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingBottom: 20
  },
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
    fontFamily: 'AvenirNextLTPro-Regular',
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3
  },
  audiusLogoHorizontal: {
    width: 194,
    height: 51,
    marginTop: 24
  },
  signupCTAContainer: {
    flex: 1,
    marginTop: 32
  },
  signupCTA: {
    resizeMode: 'contain',
    flex: 1,
    marginTop: 32,
    width: windowWidth - 64
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
    marginTop: 16,
    padding: 10,
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
    height: 32,
    width: '100%',
    alignItems: 'center',
    margin: 38
  },
  switchFormBtnTitle: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Medium'
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
  hasAccountAlready: 'Already have an account?'
}

const errorMessages = {
  invalidEmail: 'Please enter a valid email',
  emailInUse: 'Email is already in use, please sign-in',
  emptyPassword: 'Please enter a password',
  default: 'Invalid Credentials'
}

let formContainerHeight = 0
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
  const emailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailRe.test(String(email).toLowerCase())
}

type SignOnProps = NativeStackScreenProps<RootStackParamList, 'SignOn'>
const SignOn = ({ navigation }: SignOnProps) => {
  const dispatchWeb = useDispatchWeb()
  const dispatch = useDispatch()

  const [isWorking, setIsWorking] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignin, setisSignIn] = useState(false)
  const [emailBorderColor, setEmailBorderColor] = useState(defaultBorderColor)
  const [passBorderColor, setPassBorderColor] = useState(defaultBorderColor)
  const [formButtonMarginTop, setFormButtonMarginTop] = useState(28)
  const [cpaContainerHeight, setcpaContainerHeight] = useState(0)
  const [attemptedEmail, setAttemptedEmail] = useState(false)
  const [attemptedPassword, setAttemptedPassword] = useState(false)
  const [showInvalidEmailError, setShowInvalidEmailError] = useState(false)
  const [showEmptyPasswordError, setShowEmptyPasswordError] = useState(false)
  const [showDefaultError, setShowDefaultError] = useState(false)

  const isSigninError = useSelector(getIsSigninError)
  const dappLoaded = useSelector(getDappLoaded)
  const signedIn = useSelector(getIsSignedIn)
  const emailIsAvailable = useSelector(getEmailIsAvailable)
  const emailIsValid = useSelector(getEmailIsValid)
  const emailStatus = useSelector(getEmailStatus)

  const setPushNotificationsReminderVisible = useCallback(
    (visible: boolean) =>
      dispatch(setVisibility({ drawer: 'EnablePushNotifications', visible })),
    [dispatch]
  )

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

  useEffect(() => {
    setShowInvalidEmailError(attemptedEmail && !emailIsValid)
  }, [attemptedEmail, emailIsValid])

  useEffect(() => {
    setShowEmptyPasswordError(attemptedPassword && password === '')
  }, [attemptedPassword, password])

  useEffect(() => {
    if (isSigninError && isWorking) {
      setIsWorking(false)
    }
  }, [isSigninError, isWorking])

  useEffect(() => {
    if (signedIn) {
      setIsWorking(false)
      setEmail('')
      setPassword('')

      remindUserToTurnOnNotifications(setPushNotificationsReminderVisible)
    }
  }, [signedIn, setPushNotificationsReminderVisible])

  useEffect(() => {
    if (dappLoaded) {
      animateDrawer()
      fadeCTA()
    }
  }, [dappLoaded, animateDrawer, fadeCTA])

  useEffect(() => {
    if (
      (isSignin && isSigninError && showDefaultError) ||
      (!isSignin && !emailIsAvailable && email !== '') ||
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
    isSigninError,
    showDefaultError,
    emailIsAvailable,
    email,
    showInvalidEmailError,
    showEmptyPasswordError
  ])

  const errorView = () => {
    if (isSignin && isSigninError && showDefaultError) {
      return (
        <Animated.View
          style={[styles.errorContainer, { opacity: errorOpacity }]}
        >
          <ValidationIconX style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessages.default}</Text>
        </Animated.View>
      )
    }
    if (!isSignin && !emailIsAvailable && email !== '') {
      return (
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => {
            switchForm(true)
          }}
        >
          <Animated.View
            style={[styles.errorContainer, { opacity: errorOpacity }]}
          >
            <ValidationIconX style={styles.errorIcon} />
            <Text
              style={[
                styles.errorText,
                { flex: 0, textDecorationLine: 'underline' }
              ]}
            >
              {errorMessages.emailInUse}
            </Text>
            <Text style={[styles.errorText, { fontSize: 13 }]}> ➔</Text>
          </Animated.View>
        </TouchableOpacity>
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

  const FormSwitchButton = () => {
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

  const switchForm = (keepEmail = false) => {
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

      if (!keepEmail) {
        setEmail('')
      }

      setShowInvalidEmailError(false)
      setAttemptedEmail(false)
      setShowEmptyPasswordError(false)
      setAttemptedPassword(false)
      setisSignIn(!isSignin)
      dispatch(signonActions.signinFailedReset())
      Keyboard.dismiss()
    }
  }

  const passwordField = () => {
    if (isSignin) {
      return (
        <TextInput
          style={[styles.inputPass, { borderColor: passBorderColor }]}
          placeholderTextColor='#C2C0CC'
          underlineColorAndroid='transparent'
          placeholder='Password'
          autoCompleteType='off'
          autoCorrect={false}
          autoCapitalize='none'
          enablesReturnKeyAutomatically={true}
          maxLength={100}
          textContentType='password'
          secureTextEntry={true}
          onChangeText={newText => {
            setAttemptedPassword(true)
            setShowDefaultError(false)
            setPassword(newText)
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

  const MainButton = ({
    isSignin,
    isWorking
  }: {
    isSignin: boolean
    isWorking: boolean
  }) => {
    let opacity = new Animated.Value(1)

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
                  // in case email is what was wrong with the credentials
                  setShowDefaultError(true)
                }
              } else if (emailIsAvailable && emailStatus === 'done') {
                dispatch(signonActions.signinFailedReset())
                setIsWorking(false)
                navigation.replace('CreatePassword', { email })
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
              <LottieView
                style={styles.loadingIcon}
                source={require('../../assets/animations/loadingSpinner.json')}
                autoPlay
                loop
              />
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
    dispatch(signonActions.setEmailStatus('editing'))
    dispatchWeb({
      type: MessageType.SIGN_UP_VALIDATE_AND_CHECK_EMAIL,
      email: email,
      isAction: true
    })
  }

  const signIn = () => {
    setIsWorking(true)
    dispatch(signonActions.signinFailedReset())
    dispatchWeb({
      type: MessageType.SUBMIT_SIGNIN,
      email,
      password,
      isAction: true
    })
  }

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
            onLayout={(event: any) => {
              formContainerHeight = event.nativeEvent.layout.height
              setcpaContainerHeight(
                Dimensions.get('window').height - formContainerHeight
              )
            }}
          >
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
              autoCompleteType='off'
              autoCorrect={false}
              autoCapitalize='none'
              enablesReturnKeyAutomatically={true}
              maxLength={100}
              value={email}
              textContentType='emailAddress'
              onChangeText={newText => {
                setShowDefaultError(false)
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
            {passwordField()}
            {errorView()}
            <MainButton isWorking={isWorking} isSignin={isSignin} />
          </Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.containerCTA,
            { height: cpaContainerHeight, opacity: opacityCTA }
          ]}
        >
          {Dimensions.get('window').height < 720 ? (
            <></>
          ) : (
            <View style={styles.signupCTAContainer}>
              <Image source={signupCTA} style={styles.signupCTA} />
            </View>
          )}

          <TouchableOpacity
            style={styles.switchFormBtn}
            activeOpacity={0.6}
            onPress={() => {
              switchForm()
            }}
          >
            <FormSwitchButton />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default SignOn
