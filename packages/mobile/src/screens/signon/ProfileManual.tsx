import { useState, useEffect, useCallback } from 'react'

import type { Image } from '@audius/common/store'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField,
  getNameField,
  getProfileImageField,
  getIsVerified
} from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import {
  Animated,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import ValidationIconX from 'app/assets/images/iconValidationX.svg'
import Button from 'app/components/button'
import LoadingSpinner from 'app/components/loading-spinner'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'
import { useColor, useThemeColors } from 'app/utils/theme'

import PhotoButton from './PhotoButton'
import ProfileImage from './ProfileImage'
import SignupHeader from './SignupHeader'
import type { SignOnStackParamList } from './types'

const defaultBorderColor = '#F2F2F4'

const useStyles = makeStyles(({ palette }) => ({
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
    padding: 26
  },
  title: {
    color: '#7E1BCC',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold',
    lineHeight: 26,
    textAlign: 'center',
    paddingBottom: 12,
    marginLeft: 22,
    marginRight: 22
  },
  handleInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    width: '100%',
    marginTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: defaultBorderColor,
    backgroundColor: '#FCFCFC',
    borderRadius: 4,
    padding: 10
  },
  atLabel: {
    color: '#C2C0CC',
    fontFamily: 'AvenirNextLTPro-Regular',
    fontSize: 16,
    marginRight: 2
  },
  handleInput: {
    height: 42,
    color: '#858199',
    fontFamily: 'AvenirNextLTPro-DemiBold',
    fontSize: 16,
    flex: 1
  },
  input: {
    height: 42,
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
    fontFamily: 'AvenirNextLTPro-DemiBold',
    fontSize: 16
  },
  formBtn: {
    flexDirection: 'row',
    marginTop: 16,
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC0FE0',
    borderRadius: 4
  },
  buttonContainer: {
    width: '100%',
    marginTop: 16
  },
  button: {
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
  photoLoadingIconContainer: {
    position: 'absolute',
    top: 88,
    left: 78
  },
  photoLoadingIcon: {
    width: 48,
    height: 48
  },
  profilePicContainer: {
    flex: 0,
    alignContent: 'center'
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
  errorContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingLeft: 10,
    margin: 0
  }
}))

const messages = {
  header: 'Tell Us About Yourself So Others Can Find You',
  continue: 'Continue',
  errors: [
    'Sorry, handle is too long',
    'Only use A-Z, 0-9, and underscores',
    'That handle has already been taken',
    'This verified Twitter handle is reserved.',
    'This verified Instagram handle is reserved.'
  ],
  errorTypes: [
    'tooLong',
    'characters',
    'inUse',
    'twitterReserved',
    'instagramReserved'
  ]
}

let didAnimation = false
const FormTitle = () => {
  const styles = useStyles()
  let opacity = new Animated.Value(1)
  if (!didAnimation) {
    opacity = new Animated.Value(0)
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      didAnimation = true
    })
  }
  return (
    <Animated.View style={{ opacity }}>
      <Text style={styles.title}>{messages.header}</Text>
    </Animated.View>
  )
}

const ContinueButton = ({
  isWorking,
  onPress,
  disabled
}: {
  isWorking: boolean
  onPress: () => void
  disabled: boolean
}) => {
  const styles = useStyles()
  const { staticWhite } = useThemeColors()
  return (
    <Button
      title={messages.continue}
      containerStyle={styles.buttonContainer}
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      icon={
        isWorking ? (
          <LoadingSpinner style={styles.loadingIcon} color={staticWhite} />
        ) : (
          <IconArrow style={styles.arrowIcon} fill='white' />
        )
      }
    />
  )
}

let updateHandleConfirmationTimeout: any
const HANDLE_VALIDATION_IN_PROGRESS_DELAY_MS = 1000

export type ProfileManualProps = NativeStackScreenProps<
  SignOnStackParamList,
  'ProfileManual'
>
const ProfileManual = ({ navigation }: ProfileManualProps) => {
  const spinnerColor = useColor('staticWhite')
  const styles = useStyles()
  const dispatch = useDispatch()

  const handleField = useSelector(getHandleField)
  const nameField = useSelector(getNameField)
  const emailField = useSelector(getEmailField)
  const profileImage = useSelector(getProfileImageField)
  const isVerified: boolean = useSelector(getIsVerified)

  const [showHandleConfirmingSpinner, setShowHandleConfirmingSpinner] =
    useState(false)
  const [nameBorderColor, setNameBorderColor] = useState(defaultBorderColor)
  const [handleBorderColor, setHandleBorderColor] = useState(defaultBorderColor)
  const [photoBtnIsHidden, setPhotoBtnIsHidden] = useState(false)
  const [isPhotoLoading, setIsPhotoLoading] = useState(false)
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false)

  useEffect(() => {
    setIsSubmitDisabled(
      !nameField.value.trim().length ||
        !handleField.value.length ||
        handleField.status === EditingStatus.EDITING ||
        handleField.status === EditingStatus.LOADING ||
        handleField.status === EditingStatus.FAILURE
    )

    // if handle change timeout was set and validation
    // has returned, then clear the timeout
    if (handleField.status === EditingStatus.SUCCESS) {
      if (updateHandleConfirmationTimeout) {
        clearTimeout(updateHandleConfirmationTimeout)
      }
      setShowHandleConfirmingSpinner(false)
    }
  }, [nameField, handleField])

  useEffect(() => {
    if (profileImage !== null) {
      setPhotoBtnIsHidden(true)
    }
  }, [profileImage])

  const LoadingPhoto = () => {
    return isPhotoLoading ? (
      <View style={styles.photoLoadingIconContainer}>
        <LoadingSpinner style={styles.photoLoadingIcon} color={spinnerColor} />
      </View>
    ) : null
  }

  const openPhotoMenu = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setIsPhotoLoading(true)
      dispatch(signOnActions.setField('profileImage', image))
    }

    const imageOptions = {
      height: 1000,
      width: 1000,
      cropperCircleOverlay: true
    }

    launchSelectImageActionSheet(handleImageSelected, imageOptions)
  }, [setIsPhotoLoading, dispatch])

  const errorView = ({
    handleIsValid,
    handleError
  }: {
    handleIsValid: boolean
    handleError: string
  }) => {
    if (!handleIsValid && handleError !== '') {
      return (
        <View style={styles.errorContainer}>
          <ValidationIconX style={styles.errorIcon} />
          <Text style={styles.errorText}>
            &nbsp;
            {messages.errors[messages.errorTypes.indexOf(handleError)]}
            &nbsp;
          </Text>
        </View>
      )
    } else {
      return (
        <View style={styles.errorContainer}>
          <ValidationIconX style={[styles.errorIcon, { opacity: 0 }]} />
          <Text style={styles.errorText}>&nbsp;</Text>
        </View>
      )
    }
  }

  const validateHandle = (handle: string) => {
    dispatch(signOnActions.validateHandle(handle, isVerified))
  }

  const onContinuePress = () => {
    Keyboard.dismiss()

    dispatch(signOnActions.signUp())
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_COMPLETE_PROFILE,
        handle: handleField.value,
        emailAddress: emailField.value
      })
    )
    navigation.push('FirstFollows')
  }

  const handlePressBackButton = useCallback(() => {
    navigation.replace('ProfileAuto')
  }, [navigation])

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
            <SignupHeader showBackButton onPressBack={handlePressBackButton} />
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
              style={styles.container}
            >
              <View style={styles.containerForm}>
                <FormTitle />
                <View style={styles.profilePicContainer}>
                  <ProfileImage
                    isPhotoLoading={isPhotoLoading}
                    setIsPhotoLoading={setIsPhotoLoading}
                    hasSelectedImage={!!profileImage}
                    photoBtnIsHidden={photoBtnIsHidden}
                    setPhotoBtnIsHidden={setPhotoBtnIsHidden}
                    profileImage={profileImage as any}
                  />
                  <PhotoButton
                    hasSelectedImage={!!profileImage}
                    photoBtnIsHidden={photoBtnIsHidden}
                    doAction={openPhotoMenu}
                  />
                  <LoadingPhoto />
                </View>
                <TextInput
                  style={[styles.input, { borderColor: nameBorderColor }]}
                  placeholderTextColor='#C2C0CC'
                  underlineColorAndroid='transparent'
                  placeholder='Display Name'
                  keyboardType='default'
                  autoComplete='off'
                  autoCorrect={false}
                  autoCapitalize='words'
                  enablesReturnKeyAutomatically={true}
                  maxLength={32}
                  textContentType='name'
                  value={nameField.value}
                  onChangeText={(newText) => {
                    dispatch(signOnActions.setValueField('name', newText))
                  }}
                  onFocus={() => {
                    setNameBorderColor('#7E1BCC')
                  }}
                  onBlur={() => {
                    setNameBorderColor(defaultBorderColor)
                  }}
                />

                <View
                  style={[
                    styles.handleInputContainer,
                    { borderColor: handleBorderColor }
                  ]}
                >
                  <Text style={styles.atLabel}>@</Text>
                  <TextInput
                    style={styles.handleInput}
                    placeholderTextColor='#C2C0CC'
                    underlineColorAndroid='transparent'
                    placeholder='Handle'
                    keyboardType='email-address'
                    autoComplete='off'
                    autoCorrect={false}
                    autoCapitalize='none'
                    enablesReturnKeyAutomatically={true}
                    maxLength={16}
                    textContentType='nickname'
                    value={handleField.value}
                    onChangeText={(newText) => {
                      clearTimeout(updateHandleConfirmationTimeout)
                      updateHandleConfirmationTimeout = setTimeout(() => {
                        // Show a spinner after a delay while the handle validates
                        setShowHandleConfirmingSpinner(true)
                      }, HANDLE_VALIDATION_IN_PROGRESS_DELAY_MS)
                      const newHandle = newText.trim()
                      dispatch(signOnActions.setValueField('handle', newHandle))
                      validateHandle(newHandle)
                    }}
                    onFocus={() => {
                      setHandleBorderColor('#7E1BCC')
                    }}
                    onBlur={() => {
                      setHandleBorderColor(defaultBorderColor)
                    }}
                  />
                </View>

                {errorView({
                  handleIsValid: !handleField.error,
                  handleError: handleField.error
                })}

                <ContinueButton
                  isWorking={
                    (handleField.status === EditingStatus.EDITING ||
                      handleField.status === EditingStatus.LOADING) &&
                    showHandleConfirmingSpinner
                  }
                  onPress={onContinuePress}
                  disabled={isSubmitDisabled}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ProfileManual
