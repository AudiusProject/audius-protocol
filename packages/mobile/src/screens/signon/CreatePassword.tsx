import { useState, useEffect, useRef, useCallback } from 'react'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as signOnActions from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import type { EditableField } from 'common/store/pages/signon/types'
import commonPasswordList from 'fxa-common-password-list'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import {
  IconArrowRight,
  IconCheck,
  IconValidationX
} from '@audius/harmony-native'
import Button from 'app/components/button'
import LoadingSpinner from 'app/components/loading-spinner'
import { track, make } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import SignupHeader from './SignupHeader'
import type { SignOnStackParamList } from './types'

const defaultBorderColor = '#F2F2F4'
const purpleBorderColor = '#7E1BCC'
const errorBorderColor = '#E03D51'

const styles = StyleSheet.create({
  container: {
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
    color: '#858199',
    textAlignVertical: 'center',
    justifyContent: 'center',
    fontFamily: 'AvenirNextLTPro-DemiBold',
    fontSize: 16
  },
  mainButtonContainer: {
    width: '100%',
    marginTop: 32
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
    marginTop: 26
  },
  termsText: {
    color: '#858199',
    fontSize: 12,
    lineHeight: 21,
    fontFamily: 'AvenirNextLTPro-Regular'
  },
  clickable: {
    color: '#CC0FE0'
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

const opacityArr = messages.checks.map(() => new Animated.Value(0))
const Checkbox = ({
  i,
  met,
  error
}: {
  i: number
  met: boolean
  error: boolean
}) => {
  const opacity = opacityArr[i]

  if (met || error) {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true
    }).start(() => {})
  }

  const animatedStyles = [
    styles.iconCheck,
    {
      opacity,
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

  if (met) {
    return (
      <View style={styles.checkboxContainer}>
        <Animated.View style={animatedStyles}>
          <IconCheck style={styles.iconCheck} />
        </Animated.View>
        <View style={styles.unchecked} />
        <Text style={styles.uncheckedDescription}>{messages.checks[i]}</Text>
      </View>
    )
  } else if (error) {
    return (
      <View style={styles.checkboxContainer}>
        <Animated.View style={animatedStyles}>
          <IconValidationX style={styles.iconCheck} />
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
  SignOnStackParamList,
  'CreatePassword'
>
const CreatePassword = ({ navigation, route }: CreatePasswordProps) => {
  const dispatch = useDispatch()

  const emailField: EditableField = useSelector(getEmailField)

  const [passwordBorderColor, setPasswordBorderColor] =
    useState(defaultBorderColor)
  const [passwordConfirmationBorderColor, setPasswordConfirmationBorderColor] =
    useState(defaultBorderColor)
  const [isWorking, setisWorking] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isPasswordConfirmationFocused, setIsPasswordConfirmationFocused] =
    useState(false)

  // the first 3 requirements are based on the password field
  // the last one is based on both fields as it requires a match
  const [areRequirementsMet, setAreRequirementsMet] = useState({
    number: {
      met: false,
      error: false
    },
    length: {
      met: false,
      error: false
    },
    hardToGuess: {
      met: false,
      error: false
    },
    match: {
      met: false,
      error: false
    }
  })

  useEffectOnce(() => {
    dispatch(signOnActions.fetchAllFollowArtists())
  })

  useEffect(() => {
    setIsDisabled(
      isWorking || Object.values(areRequirementsMet).some((v) => !v.met)
    )
  }, [isWorking, areRequirementsMet])

  useEffect(() => {
    const hasError = Object.values(areRequirementsMet).some((v) => v.error)
    // if in an error state, show red borders on each field
    if (hasError) {
      setPasswordBorderColor(errorBorderColor)
      setPasswordConfirmationBorderColor(errorBorderColor)
    } else {
      // if one of the fields is focused, show purple border on that field
      if (isPasswordFocused) {
        setPasswordBorderColor(purpleBorderColor)
        setPasswordConfirmationBorderColor(defaultBorderColor)
      } else if (isPasswordConfirmationFocused) {
        setPasswordConfirmationBorderColor(purpleBorderColor)
        setPasswordBorderColor(defaultBorderColor)
      } else {
        // if no error and no focus, set default borders
        setPasswordBorderColor(defaultBorderColor)
        setPasswordConfirmationBorderColor(defaultBorderColor)
      }
    }
  }, [areRequirementsMet, isPasswordFocused, isPasswordConfirmationFocused])

  const { staticWhite } = useThemeColors()

  const updateRequirementsStatus = useCallback(
    (
      previousRequirements: any,
      newPassword: string,
      newPasswordConfirmation: string,
      isBlur
    ) => {
      // set error if field in question is not empty and
      // - requirement previously met, or
      // - on blur
      setAreRequirementsMet({
        number: {
          ...previousRequirements.number,
          met: /\d/.test(newPassword),
          error:
            !!newPassword.length &&
            !/\d/.test(newPassword) &&
            (isBlur ||
              previousRequirements.number.met ||
              previousRequirements.number.error)
        },
        length: {
          ...previousRequirements.length,
          met: newPassword.length >= MIN_PASSWORD_LEN,
          error:
            !!newPassword.length &&
            newPassword.length < MIN_PASSWORD_LEN &&
            (isBlur ||
              previousRequirements.length.met ||
              previousRequirements.length.error)
        },
        hardToGuess: {
          ...previousRequirements.hardToGuess,
          met:
            newPassword.length >= MIN_PASSWORD_LEN &&
            !commonPasswordList.test(newPassword),
          error:
            !!newPassword.length &&
            commonPasswordList.test(newPassword) &&
            (isBlur ||
              previousRequirements.hardToGuess.met ||
              previousRequirements.hardToGuess.error)
        },
        match: {
          ...previousRequirements.match,
          met: !!newPassword.length && newPassword === newPasswordConfirmation,
          error:
            !!newPassword.length &&
            !!newPasswordConfirmation.length &&
            newPassword !== newPasswordConfirmation &&
            (isBlur ||
              previousRequirements.match.met ||
              previousRequirements.match.error)
        }
      })
    },
    []
  )

  const onTermsOfUse = () => {
    Linking.openURL('https://audius.co/legal/terms-of-use').catch((err) =>
      console.error('An error occurred trying to open terms of use', err)
    )
  }

  const onPrivacyPolicy = () => {
    Linking.openURL('https://audius.co/legal/privacy-policy').catch((err) =>
      console.error('An error occurred trying to open privacy policy', err)
    )
  }

  const ContinueButton = ({ isWorking }: { isWorking: boolean }) => {
    return (
      <Button
        title={messages.continue}
        onPress={() => {
          Keyboard.dismiss()
          setisWorking(true)
          dispatch(signOnActions.setValueField('password', password))
          track(
            make({
              eventName: EventNames.CREATE_ACCOUNT_COMPLETE_PASSWORD,
              emailAddress: emailField.value
            })
          )
          navigation.push('ProfileAuto')
        }}
        disabled={isDisabled}
        containerStyle={styles.mainButtonContainer}
        style={styles.mainButton}
        icon={
          isWorking ? (
            <LoadingSpinner style={styles.loadingIcon} color={staticWhite} />
          ) : (
            <IconArrowRight style={styles.arrowIcon} fill='white' />
          )
        }
      />
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ overflow: 'hidden' }}
      >
        <ScrollView
          style={{ height: '100%' }}
          keyboardShouldPersistTaps='always'
        >
          <View>
            <SignupHeader />
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View style={styles.container}>
                <View style={styles.containerForm}>
                  <FormTitle />
                  <TextInput
                    style={[styles.input, { borderColor: passwordBorderColor }]}
                    placeholderTextColor='#C2C0CC'
                    underlineColorAndroid='transparent'
                    placeholder='Password'
                    autoComplete='off'
                    autoCorrect={false}
                    autoCapitalize='none'
                    enablesReturnKeyAutomatically={true}
                    maxLength={100}
                    textContentType='newPassword'
                    secureTextEntry={true}
                    onChangeText={(newText) => {
                      setPassword(newText)
                      updateRequirementsStatus(
                        { ...areRequirementsMet },
                        newText,
                        passwordConfirmation,
                        false
                      )
                    }}
                    onFocus={() => {
                      setIsPasswordFocused(true)
                    }}
                    onBlur={() => {
                      setIsPasswordFocused(false)
                      updateRequirementsStatus(
                        { ...areRequirementsMet },
                        password,
                        passwordConfirmation,
                        true
                      )
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
                    autoComplete='off'
                    autoCorrect={false}
                    autoCapitalize='none'
                    enablesReturnKeyAutomatically={true}
                    maxLength={100}
                    textContentType='newPassword'
                    secureTextEntry={true}
                    onChangeText={(newText) => {
                      setPasswordConfirmation(newText)
                      updateRequirementsStatus(
                        { ...areRequirementsMet },
                        password,
                        newText,
                        false
                      )
                    }}
                    onFocus={() => {
                      setIsPasswordConfirmationFocused(true)
                    }}
                    onBlur={() => {
                      setIsPasswordConfirmationFocused(false)
                      updateRequirementsStatus(
                        { ...areRequirementsMet },
                        password,
                        passwordConfirmation,
                        true
                      )
                    }}
                    keyboardAppearance='dark'
                  />
                  {Object.values(areRequirementsMet).map(
                    ({ met, error }, i) => (
                      <Checkbox key={i} i={i} met={met} error={error} />
                    )
                  )}

                  <Text style={styles.terms}>
                    <Text style={styles.termsText}>
                      {messages.termsAndPrivacy}
                    </Text>
                    <Text
                      style={{ ...styles.termsText, ...styles.clickable }}
                      onPress={onTermsOfUse}
                    >
                      &nbsp;{messages.terms}
                    </Text>
                    <Text style={styles.termsText}>&nbsp;{messages.and}</Text>
                    <Text
                      style={{ ...styles.termsText, ...styles.clickable }}
                      onPress={onPrivacyPolicy}
                    >
                      &nbsp;{messages.privacy}
                    </Text>
                  </Text>
                  <ContinueButton isWorking={isWorking} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default CreatePassword
