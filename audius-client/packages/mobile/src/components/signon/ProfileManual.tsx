import React, { useState, useEffect } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
  Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'
import LottieView from 'lottie-react-native'
import {
  Asset,
  Callback,
  ImageLibraryOptions,
  launchCamera,
  launchImageLibrary
} from 'react-native-image-picker'
import { MessageType } from '../../message/types'
import SignupHeader from './SignupHeader'
import PhotoButton from './PhotoButton'
import * as signonActions from '../../store/signon/actions'

import IconArrow from '../../assets/images/iconArrow.svg'
import NoPicture from '../../assets/images/noPicture.png'
import ValidationIconX from '../../assets/images/iconValidationX.svg'
import {
  getHandleIsValid,
  getHandleError,
  getHandleStatus
} from '../../store/signon/selectors'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from './NavigationStack'

const styles = StyleSheet.create({
  container: {
    top: -67,
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
    borderColor: '#F7F7F9',
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
    fontFamily: 'AvenirNextLTPro-Regular',
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
    borderColor: '#F7F7F9',
    backgroundColor: '#FCFCFC',
    borderRadius: 4,
    padding: 10,
    color: '#858199',
    fontFamily: 'AvenirNextLTPro-Regular',
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
    fontFamily: 'AvenirNextLTPro-Bold',
    marginRight: 12
  },
  arrow: {
    height: 20,
    width: 20
  },
  loadingIcon: {
    width: 24,
    height: 24
  },
  profilePicContainer: {
    flex: 0,
    alignContent: 'center'
  },
  profilePicEmpty: {
    flex: 0,
    width: 226,
    height: 226
  },
  profilePicShadow: {
    marginTop: 8,
    flex: 0,
    shadowColor: '#858199',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    width: 206,
    height: 206,
    marginBottom: 12
  },
  profilePic: {
    flex: 0,
    width: 206,
    height: 206,
    borderRadius: 113,
    borderWidth: 3,
    borderColor: '#FFFFFF'
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
})

const messages = {
  header: 'Tell Us About Yourself So Others Can Find You',
  continue: 'Continue',
  photoBtnAdd: 'Add',
  photoBtnChange: 'Change',
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

const ContinueButton = ({ isWorking }: { isWorking: boolean }) => {
  return (
    <View style={styles.formButtonTitleContainer}>
      <Text style={styles.formButtonTitle}>{messages.continue}</Text>
      {isWorking ? (
        <View style={styles.loadingIcon}>
          <LottieView
            source={require('../../assets/animations/loadingSpinner.json')}
            autoPlay
            loop
          />
        </View>
      ) : (
        <IconArrow style={styles.arrow} fill='white' />
      )}
    </View>
  )
}

let handleTimeout = 0
const HANDLE_VALIDATION_IN_PROGRESS_DELAY_MS = 1000

export type ProfileManualProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileManual'
>
const ProfileManual = ({ navigation, route }: ProfileManualProps) => {
  const {
    email,
    password,
    name: oAuthName = '',
    handle: oAuthHandle = '',
    twitterId = '',
    twitterScreenName = '',
    instagramId = '',
    instagramScreenName = '',
    verified = false,
    profilePictureUrl = null,
    coverPhotoUrl = null
  } = route.params
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const handleIsValid = useSelector(getHandleIsValid)
  const handleStatus = useSelector(getHandleStatus)
  const handleError = useSelector(getHandleError)
  const [name, setName] = useState(oAuthName)
  const [handle, setHandle] = useState(oAuthHandle)
  const [handleDebounce, setHandleDebounce] = useState(false)
  const [nameBorderColor, setNameBorderColor] = useState('#F7F7F9')
  const [handleBorderColor, setHandleBorderColor] = useState('#F7F7F9')
  const [photoBtnIsHidden, setPhotoBtnIsHidden] = useState(false)
  const [profileImage, setProfileImage] = useState<any>(
    profilePictureUrl
      ? {
          uri: profilePictureUrl
        }
      : {
          height: 0,
          width: 0,
          name: '',
          size: 0,
          fileType: '',
          uri: '',
          file: ''
        }
  )
  const [imageSet, setImageSet] = useState(!!profilePictureUrl)
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false)

  useEffect(() => {
    setIsSubmitDisabled(
      !name.trim().length ||
        !handle.length ||
        handleStatus === 'editing' ||
        !handleIsValid
    )

    // if handle change timeout was set and validation
    // has returned, then clear the timeout
    if (handleStatus === 'done') {
      if (handleTimeout) {
        clearTimeout(handleTimeout)
      }
      setHandleDebounce(false)
    }
  }, [name, handle, handleStatus, handleIsValid])

  useEffect(() => {
    setPhotoBtnIsHidden(profileImage.file !== '')
  }, [profileImage])

  const ProfileImage = () => {
    return imageSet ? (
      <TouchableOpacity
        style={styles.profilePicShadow}
        activeOpacity={1}
        onPress={() => {
          setPhotoBtnIsHidden(!photoBtnIsHidden)
        }}
      >
        <Image
          source={profileImage}
          height={206}
          width={206}
          style={[styles.profilePic]}
        />
      </TouchableOpacity>
    ) : (
      <Image
        height={226}
        width={226}
        source={NoPicture}
        style={styles.profilePicEmpty}
      />
    )
  }

  const photoOptions = {
    includeBase64: true,
    maxWidth: 1440,
    mediaType: 'photo',
    quality: 0.9
  }

  const handlePhoto = ({ assets }: { assets: Asset[] | undefined }) => {
    const response = assets?.[0]
    if (response?.base64) {
      const image = {
        height: response.height ?? 0,
        width: response.width ?? 0,
        name: response.fileName ?? response.uri?.split('/').pop() ?? '',
        size: response.fileSize ?? 0,
        fileType: response.type ?? '',
        uri: response.uri ?? '',
        file: `data:${response.type};base64,${response.base64}`
      }
      setProfileImage(image)
      setImageSet(true)
    }
  }

  const selectPhotoFromLibrary = () => {
    launchImageLibrary(
      {
        ...photoOptions,
        selectionLimit: 1
      } as ImageLibraryOptions,
      handlePhoto as Callback
    )
  }

  const takePhoto = () => {
    launchCamera(
      {
        ...photoOptions,
        saveToPhotos: true
      } as ImageLibraryOptions,
      handlePhoto as Callback
    )
  }

  const openPhotoMenu = () => {
    if (Platform.OS === 'ios') {
      // iOS ActionSheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Photo Library', 'Take Photo'],
          tintColor: '#7E1BCC',
          cancelButtonIndex: 0
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            selectPhotoFromLibrary()
          } else if (buttonIndex === 2) {
            takePhoto()
          }
        }
      )
    } else {
      // Android Alert
      Alert.alert(
        'Profile Photo',
        '',
        [
          {
            text: 'Photo Library',
            style: 'default',
            onPress: () => selectPhotoFromLibrary()
          },
          {
            text: 'Take Photo',
            style: 'default',
            onPress: () => takePhoto()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ],
        {
          cancelable: true,
          onDismiss: () => null
        }
      )
    }
  }

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
    dispatchWeb({
      type: MessageType.SIGN_UP_VALIDATE_HANDLE,
      handle: handle,
      verified,
      onValidate: null,
      isAction: true
    })
  }

  const onContinuePress = () => {
    Keyboard.dismiss()

    dispatchWeb({
      type: MessageType.SUBMIT_SIGNUP,
      email,
      password,
      name: name.trim(),
      handle,
      verified,
      // if the file property is populated, it means the user picked from photo library
      // otherwise we take the profile picture url from oauth if the user went through oauth
      // if there is no profile picture url, we ensure that it's null
      profilePictureUrl: profileImage.file
        ? profileImage.file
        : profilePictureUrl ?? null,
      coverPhotoUrl,
      accountAlreadyExisted: false,
      referrer: null,
      twitterId,
      twitterScreenName,
      instagramId,
      instagramScreenName,
      isAction: true
    })

    navigation.push('FirstFollows', {
      email,
      handle
    })
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
              <View style={styles.profilePicContainer}>
                <ProfileImage />
                <PhotoButton
                  imageSet={imageSet}
                  photoBtnIsHidden={photoBtnIsHidden}
                  doAction={openPhotoMenu}
                />
              </View>
              <TextInput
                style={[styles.input, { borderColor: nameBorderColor }]}
                placeholderTextColor='#C2C0CC'
                underlineColorAndroid='transparent'
                placeholder='Display Name'
                keyboardType='default'
                autoCompleteType='off'
                autoCorrect={false}
                autoCapitalize='words'
                enablesReturnKeyAutomatically={true}
                maxLength={32}
                textContentType='name'
                value={name}
                onChangeText={newText => {
                  setName(newText)
                }}
                onFocus={() => {
                  setNameBorderColor('#7E1BCC')
                }}
                onBlur={() => {
                  setNameBorderColor('#F7F7F9')
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
                  autoCompleteType='off'
                  autoCorrect={false}
                  autoCapitalize='none'
                  enablesReturnKeyAutomatically={true}
                  maxLength={16}
                  textContentType='nickname'
                  value={handle}
                  onChangeText={newText => {
                    clearTimeout(handleTimeout)
                    handleTimeout = setTimeout(() => {
                      // if the handle validation has not returned yet, then set to true
                      // to denote that validation is still in progess after the 1s delay
                      if (handleStatus === 'editing') {
                        setHandleDebounce(true)
                      }
                    }, HANDLE_VALIDATION_IN_PROGRESS_DELAY_MS)
                    dispatch(signonActions.setHandleStatus('editing'))
                    const newHandle = newText.trim()
                    setHandle(newHandle)
                    validateHandle(newHandle)
                  }}
                  onFocus={() => {
                    setHandleBorderColor('#7E1BCC')
                  }}
                  onBlur={() => {
                    setHandleBorderColor('#F7F7F9')
                  }}
                />
              </View>

              {errorView({ handleIsValid, handleError })}

              <TouchableOpacity
                style={[
                  styles.formBtn,
                  isSubmitDisabled ? styles.btnDisabled : {}
                ]}
                activeOpacity={0.6}
                disabled={isSubmitDisabled}
                onPress={onContinuePress}
              >
                <ContinueButton
                  isWorking={handleStatus === 'editing' && handleDebounce}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ProfileManual
