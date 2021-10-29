import React, { useState, useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector, useDispatch } from 'react-redux'
import SignupHeader from './SignupHeader'
import LottieView from 'lottie-react-native'
import * as lifecycleActions from '../../store/lifecycle/actions'
import { getOnSignUp } from '../../store/lifecycle/selectors'
import IconArrow from '../../assets/images/iconArrow.svg'
import IconCheck from '../../assets/images/iconValidationCheck.svg'
import ValidationIconX from '../../assets/images/iconValidationX.svg'
import commonPasswordList from 'fxa-common-password-list'
import { MessageType } from '../../message/types'
import { track, make } from '../../utils/analytics'
import { EventNames } from '../../types/analytics'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from './NavigationStack'

declare module 'fxa-common-password-list'

const defaultBorderColor = '#F7F7F9'
const validBorderColor = '#7E1BCC'
const errorBorderColor = '#E03D51'

const styles = StyleSheet.create({
  container: {
    top: -47,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    justifyContent: 'space-evenly'
  },
  containerForm: {
    left: 0,
    width: '100%',
    alignItems: 'center',
    padding: 38
  },
  title: {
    color: '#7E1BCC',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold',
    lineHeight: 26,
    textAlign: 'center',
    paddingBottom: 6
  },
  header: {
    color: '#858199',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 3
  },
  input: {
    height: 40,
    width: '100%',
    marginTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: defaultBorderColor,
    backgroundColor: '#FCFCFC',
    borderRadius: 4,
    padding: 10,
    color: '#858199',
    fontFamily: 'AvenirNextLTPro-Regular',
    fontSize: 16
  },
  formBtn: {
    flexDirection: 'row',
    marginTop: 26,
    height: 48,
    width: '100%',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#CC0FE0',
    borderRadius: 4
  },
  btnDisabled: {
    backgroundColor: '#E7E6EB'
  },
  formButtonTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  formButtonTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold'
  },
  arrow: {
    height: 20,
    width: 20
  },
  loadingIcon: {
    width: 24,
    height: 24
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignContent: 'flex-start',
    marginTop: 16,
    width: '100%'
  },
  unchecked: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#858199',
    borderRadius: 12,
    marginRight: 13
  },
  iconCheck: {
    position: 'absolute',
    width: 16,
    height: 16,
    zIndex: 2
  },
  errorIcon: {
    position: 'absolute',
    width: 16,
    height: 16,
    zIndex: 2
  },
  uncheckedDescription: {
    color: '#858199',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Regular',
    alignSelf: 'center'
  },
  terms: {
    color: '#858199',
    fontSize: 12,
    lineHeight: 21,
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'left',
    paddingTop: 26,
    width: '100%'
  }
})

const messages = {
  header: 'Create A Password That Is Secure And Easy To Remember!',
  warning:
    'We can’t reset your password if you forget it. Write it down or use a password manager.',
  checks: [
    'Must contain numbers',
    'Length must be at least 8 characters',
    'Hard to guess',
    'Passwords match'
  ],
  commonPassword: 'Please choose a less common password',
  termsAndPrivacy:
    'By clicking continue, you state you have read and agree to Audius',
  terms: 'Terms of Use',
  and: 'and',
  privacy: 'Privacy Policy.',
  continue: 'Continue'
}

const MIN_PASSWORD_LEN = 8

const FormTitle = () => {
  const [didAnimation, setDidAnimation] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!didAnimation) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start(() => {
        setDidAnimation(true)
      })
    }
  }, [didAnimation, opacity])

  return (
    <Animated.View style={{ opacity }}>
      <Text style={styles.title}>{messages.header}</Text>
      {Dimensions.get('window').height < 650 ? (
        <View />
      ) : (
        <Text style={styles.header}>{messages.warning}</Text>
      )}
    </Animated.View>
  )
}

const ContinueButton = ({ isWorking }: { isWorking: boolean }) => {
  return isWorking ? (
    <View style={styles.loadingIcon}>
      <LottieView
        source={require('../../assets/animations/loadingSpinner.json')}
        autoPlay
        loop
      />
    </View>
  ) : (
    <View style={styles.formButtonTitleContainer}>
      <Text style={styles.formButtonTitle}>{messages.continue}</Text>
      <IconArrow style={styles.arrow} fill='white' />
    </View>
  )
}

const opacityArr = messages.checks.map(() => new Animated.Value(0))
const Checkbox = ({
  i,
  meetsReq,
  shouldShowRedErrors
}: {
  i: number
  meetsReq: boolean
  shouldShowRedErrors: boolean
}) => {
  const opacity = opacityArr[i]

  if (meetsReq || shouldShowRedErrors) {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      easing: Easing.in(Easing.bounce),
      useNativeDriver: true
    }).start(() => {})
  }

  const animatedStyles = [
    styles.iconCheck,
    {
      opacity: opacity,
      transform: [
        {
          scale: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          })
        }
      ]
    }
  ]

  if (meetsReq) {
    return (
      <View style={styles.checkboxContainer}>
        <Animated.View style={animatedStyles}>
          <IconCheck style={styles.iconCheck} />
        </Animated.View>
        <View style={styles.unchecked} />
        <Text style={styles.uncheckedDescription}>{messages.checks[i]}</Text>
      </View>
    )
  } else if (shouldShowRedErrors) {
    return (
      <View style={styles.checkboxContainer}>
        <Animated.View style={animatedStyles}>
          <ValidationIconX style={styles.iconCheck} />
        </Animated.View>
        <View style={styles.unchecked} />
        <Text
          style={[styles.uncheckedDescription, { color: errorBorderColor }]}
        >
          {messages.checks[i]}
        </Text>
      </View>
    )
  } else {
    return (
      <View style={styles.checkboxContainer}>
        <View style={styles.unchecked} />
        <Text style={styles.uncheckedDescription}>{messages.checks[i]}</Text>
      </View>
    )
  }
}

type CreatePasswordProps = NativeStackScreenProps<
  RootStackParamList,
  'CreatePassword'
>
const CreatePassword = ({ navigation, route }: CreatePasswordProps) => {
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const onSignOn = useSelector(getOnSignUp)
  const [didFetchArtists, setDidFetchArtists] = useState(false)
  const [passwordBorderColor, setPasswordBorderColor] = useState(
    defaultBorderColor
  )
  const [
    passwordConfirmationBorderColor,
    setPasswordConfirmationBorderColor
  ] = useState(defaultBorderColor)
  const [isWorking, setisWorking] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [meetsNumberReq, setMeetsNumberReq] = useState(false)
  const [meetsLengthReq, setMeetsLengthReq] = useState(false)
  const [meetsMatchReq, setMeetsMatchReq] = useState(false)
  const [meetsCommonReq, setMeetsCommonReq] = useState(false)
  const [shouldShowRedErrors, setShouldShowRedErrors] = useState(false)
  const [shouldShowRedMatchError, setShowRedMatchError] = useState(false)
  const [focusedField, setFocusedField] = useState(0)

  const checkboxes = [
    {
      meetsReq: meetsNumberReq,
      shouldShowRedErrors: shouldShowRedErrors
    },
    {
      meetsReq: meetsLengthReq,
      shouldShowRedErrors: shouldShowRedErrors
    },
    {
      meetsReq: meetsCommonReq,
      shouldShowRedErrors: shouldShowRedErrors
    },
    {
      meetsReq: meetsMatchReq,
      shouldShowRedErrors:
        passwordConfirmation.length >= password.length ||
        shouldShowRedMatchError
          ? shouldShowRedErrors
          : false
    }
  ]

  useEffect(() => {
    if (!didFetchArtists) {
      setDidFetchArtists(true)
      dispatchWeb({
        type: MessageType.FETCH_ALL_FOLLOW_ARTISTS,
        isAction: true
      })
    }
  }, [didFetchArtists, dispatchWeb])

  useEffect(() => {
    setIsDisabled(isWorking || checkboxes.some(c => !c.meetsReq))
  }, [isWorking, checkboxes])

  useEffect(() => {
    const newMeetsLengthReq = password.length >= MIN_PASSWORD_LEN
    setMeetsLengthReq(newMeetsLengthReq)

    const newMeetsMatchReq =
      password.length > 0 && password === passwordConfirmation
    setMeetsMatchReq(newMeetsMatchReq)
    if (newMeetsMatchReq && focusedField === 1) {
      setPasswordConfirmationBorderColor(defaultBorderColor)
    }

    const newMeetsNumberReq = /\d/.test(password)
    setMeetsNumberReq(newMeetsNumberReq)

    const newMeetsCommonReq =
      !commonPasswordList.test(password) && password.length >= MIN_PASSWORD_LEN
    setMeetsCommonReq(newMeetsCommonReq)

    if (
      focusedField === 2 &&
      password !== passwordConfirmation &&
      newMeetsLengthReq &&
      newMeetsMatchReq &&
      newMeetsNumberReq &&
      newMeetsCommonReq
    ) {
      setPasswordBorderColor(defaultBorderColor)
    }
  }, [password, passwordConfirmation, focusedField])

  // Set Lifecycle onSignUp(true) so signup flow isn't hidden even if signed in
  const setOnSignOn = () => {
    if (!onSignOn) {
      dispatch(lifecycleActions.onSignUp(true))
    }
  }

  const onTermsOfUse = () => {
    Linking.openURL('https://audius.co/legal/terms-of-use').catch(err =>
      console.error('An error occurred trying to open terms of use', err)
    )
  }

  const onPrivacyPolicy = () => {
    Linking.openURL('https://audius.co/legal/privacy-policy').catch(err =>
      console.error('An error occurred trying to open privacy policy', err)
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SignupHeader />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.containerForm}>
              <FormTitle />
              <TextInput
                style={[styles.input, { borderColor: passwordBorderColor }]}
                placeholderTextColor='#C2C0CC'
                underlineColorAndroid='transparent'
                placeholder='Password'
                autoCompleteType='off'
                autoCorrect={false}
                autoCapitalize='none'
                enablesReturnKeyAutomatically={true}
                maxLength={100}
                textContentType='newPassword'
                secureTextEntry={true}
                onChangeText={newText => {
                  setPassword(newText)
                  if (newText === '') {
                    setShouldShowRedErrors(false)
                  } else if (newText === passwordConfirmation) {
                    setPasswordBorderColor(validBorderColor)
                    setPasswordConfirmationBorderColor(validBorderColor)
                  }
                }}
                onFocus={() => {
                  setFocusedField(1)
                  setPasswordBorderColor(validBorderColor)
                }}
                onBlur={() => {
                  setPasswordBorderColor(defaultBorderColor)
                  setShouldShowRedErrors(password !== '')
                  if (
                    password !== '' &&
                    (!meetsCommonReq || !meetsLengthReq || !meetsNumberReq)
                  ) {
                    setPasswordBorderColor(errorBorderColor)
                  }
                  if (
                    password !== '' &&
                    passwordConfirmation !== '' &&
                    !meetsMatchReq
                  ) {
                    setPasswordBorderColor(errorBorderColor)
                    setPasswordConfirmationBorderColor(errorBorderColor)
                  }
                }}
                keyboardAppearance='dark'
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: passwordConfirmationBorderColor,
                    marginBottom: 10
                  }
                ]}
                placeholderTextColor='#C2C0CC'
                underlineColorAndroid='transparent'
                placeholder='Confirm Password'
                autoCompleteType='off'
                autoCorrect={false}
                autoCapitalize='none'
                enablesReturnKeyAutomatically={true}
                maxLength={100}
                textContentType='newPassword'
                secureTextEntry={true}
                onChangeText={newText => {
                  setPasswordConfirmation(newText)
                  if (newText === password) {
                    setPasswordBorderColor(validBorderColor)
                    setPasswordConfirmationBorderColor(validBorderColor)
                  }
                }}
                onFocus={() => {
                  setFocusedField(2)
                  setPasswordConfirmationBorderColor(validBorderColor)
                  setShowRedMatchError(false)
                }}
                onBlur={() => {
                  setPasswordConfirmationBorderColor(defaultBorderColor)

                  if (password === '') {
                    setShouldShowRedErrors(false)
                  } else {
                    setShouldShowRedErrors(true)
                    setShowRedMatchError(true)
                  }
                  if (
                    passwordConfirmation !== '' &&
                    password !== '' &&
                    !meetsMatchReq
                  ) {
                    setPasswordConfirmationBorderColor(errorBorderColor)
                    setPasswordBorderColor(errorBorderColor)
                  }
                  if (
                    meetsMatchReq &&
                    meetsCommonReq &&
                    meetsLengthReq &&
                    meetsNumberReq
                  ) {
                    setPasswordBorderColor(defaultBorderColor)
                  }
                }}
                keyboardAppearance='dark'
              />
              {checkboxes.map(({ meetsReq, shouldShowRedErrors }, i) => (
                <Checkbox
                  key={i}
                  i={i}
                  meetsReq={meetsReq}
                  shouldShowRedErrors={shouldShowRedErrors}
                />
              ))}
              <Text style={styles.terms}>
                {messages.termsAndPrivacy}
                <Text style={{ color: '#CC0FE0' }} onPress={onTermsOfUse}>
                  &nbsp;{messages.terms}
                </Text>
                <Text> {messages.and}</Text>
                <Text style={{ color: '#CC0FE0' }} onPress={onPrivacyPolicy}>
                  &nbsp;{messages.privacy}
                </Text>
              </Text>
              <TouchableOpacity
                style={[styles.formBtn, isDisabled ? styles.btnDisabled : {}]}
                disabled={isDisabled}
                activeOpacity={0.6}
                onPress={() => {
                  Keyboard.dismiss()
                  setisWorking(true)
                  setOnSignOn()
                  track(
                    make({
                      eventName: EventNames.CREATE_ACCOUNT_COMPLETE_PASSWORD,
                      emailAddress: route.params.email
                    })
                  )
                  navigation.push('ProfileAuto', {
                    email: route.params.email,
                    password
                  })
                }}
              >
                <ContinueButton isWorking={isWorking} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default CreatePassword
