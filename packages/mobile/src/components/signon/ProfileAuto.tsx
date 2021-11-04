import React, { useCallback, useEffect, useState } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView
} from 'react-native'
import SignupHeader from './SignupHeader'

import IconInstagram from '../../assets/images/iconInstagram.svg'
import IconTwitter from '../../assets/images/iconTwitterBird.svg'
import IconVerified from '../../assets/images/iconVerified.svg'
import GradientSave from '../../assets/images/gradientSave.svg'
import { MessageType } from '../../message/types'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'
import { useDispatch, useSelector } from 'react-redux'
import {
  getInstagramError,
  getInstagramInfo,
  getTwitterError,
  getTwitterInfo
} from '../../store/oauth/selectors'
import { getHandleError, getHandleIsValid } from '../../store/signon/selectors'
import LottieView from 'lottie-react-native'
import { useColor } from '../../utils/theme'
import * as oauthActions from '../../store/oauth/actions'
import { track, make } from '../../utils/analytics'
import { EventNames } from '../../types/analytics'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from './NavigationStack'
import Button from '../../components/button'

const styles = StyleSheet.create({
  container: {
    top: -45,
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
  buttonContainer: {
    marginTop: 12,
    marginBottom: 12,
    width: '100%',
    backgroundColor: '#CC0FE0'
  },
  buttonText: {
    fontSize: 20
  },
  formButtonTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    height: 20,
    width: 20,
    marginRight: 10
  },
  instruction: {
    color: '#858199',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    width: '100%',
    paddingLeft: 25,
    paddingRight: 25
  },
  instructionLong: {
    color: '#858199',
    fontSize: 12,
    lineHeight: 21,
    fontFamily: 'AvenirNextLTPro-Regular',
    textAlign: 'center',
    paddingTop: 36,
    paddingBottom: 38,
    width: '100%'
  },
  bulletsContainer: {
    marginLeft: 0,
    paddingLeft: 0,
    paddingBottom: 24
  },
  bulletpointText: {
    color: '#858199',
    fontSize: 18,
    fontFamily: 'AvenirNextLTPro-Bold'
  },
  verifiedIcon: {
    marginLeft: 8
  },
  ifApplicable: {
    fontSize: 10,
    fontFamily: 'AvenirNextLTPro-Regular',
    color: '#C2C0CC',
    marginLeft: 34
  },
  gotoManualBtn: {
    height: 32,
    width: '100%',
    alignItems: 'center'
  },
  gotoManualBtnTitle: {
    color: '#7E1BCC',
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Regular'
  },
  loadingIcon: {
    marginTop: 48,
    height: 48
  }
})

const messages = {
  header: 'Tell Us About Yourself So Others Can Find You',
  description:
    'Quickly complete your profile by linking one of your social accounts.',
  descriptionLong:
    "We will autofill your name, handle, profile picture, cover photo, location, and verification. You won't use this to log-in, and Audius will never post on your behalf.",
  twitter: 'Complete With Twitter',
  instagram: 'Complete With Instagram',
  manually: 'I’d rather fill out my profile manually',
  oauthChecks: [
    'Display Name',
    'Handle',
    'Profile Picture',
    'Cover Photo',
    'Verification'
  ],
  ifApplicable: '(if applicable)'
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

const TwitterButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <Button
      title={messages.twitter}
      containerStyle={{ ...styles.buttonContainer, backgroundColor: '#1BA1F1' }}
      textStyle={styles.buttonText}
      onPress={onPress}
      icon={
        <IconTwitter style={styles.icon} fill='white' width={32} height={32} />
      }
      iconPosition='left'
      underlayColor='#1BA1F1'
    />
  )
}

const InstagramButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <Button
      title={messages.instagram}
      containerStyle={{ ...styles.buttonContainer }}
      textStyle={styles.buttonText}
      onPress={onPress}
      icon={
        <IconInstagram
          style={styles.icon}
          fill='white'
          width={32}
          height={32}
        />
      }
      iconPosition='left'
    />
  )
}

const BulletPoint = ({ i }: { i: number }) => {
  return (
    <View
      style={[
        styles.formButtonTitleContainer,
        { marginBottom: i === messages.oauthChecks.length ? 4 : 8 }
      ]}
    >
      <GradientSave style={styles.icon} />
      <Text style={styles.bulletpointText}>{messages.oauthChecks[i]}</Text>
      {i === 4 && (
        <IconVerified height={16} width={16} style={styles.verifiedIcon} />
      )}
    </View>
  )
}

type ProfileAutoProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileAuto'
>
const ProfileAuto = ({ navigation, route }: ProfileAutoProps) => {
  const { email, password } = route.params
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()
  const spinnerColor = useColor('neutralLight4')
  const twitterInfo = useSelector(getTwitterInfo)
  const twitterError = useSelector(getTwitterError)
  const instagramInfo = useSelector(getInstagramInfo)
  const instagramError = useSelector(getInstagramError)
  const handleIsValid = useSelector(getHandleIsValid)
  const handleError = useSelector(getHandleError)
  const [isLoading, setIsLoading] = useState(false)
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false)
  const [didValidateHandle, setDidValidateHandle] = useState(false)

  const goTo = useCallback(
    (page: 'ProfileManual' | 'FirstFollows') => {
      const routeParams: any = { email }

      if (page === 'ProfileManual') {
        routeParams.password = password
      }

      if (twitterInfo) {
        routeParams.handle = twitterInfo.profile.screen_name
        if (page === 'ProfileManual') {
          routeParams.twitterId = twitterInfo.twitterId
          routeParams.name = twitterInfo.profile.name
          routeParams.twitterScreenName = twitterInfo.profile.screen_name
          routeParams.verified = twitterInfo.profile.verified
          routeParams.profilePictureUrl =
            twitterInfo.profile.profile_image_url_https ?? null
          routeParams.coverPhotoUrl =
            twitterInfo.profile.profile_banner_url ?? null
        }
      } else if (instagramInfo) {
        routeParams.handle = instagramInfo.profile.username
        if (page === 'ProfileManual') {
          routeParams.instagramId = instagramInfo.instagramId
          routeParams.name = instagramInfo.profile.full_name
          routeParams.instagramScreenName = instagramInfo.profile.username
          routeParams.verified = instagramInfo.profile.is_verified
          routeParams.profilePictureUrl =
            instagramInfo.profile.profile_pic_url_hd ?? null
          routeParams.coverPhotoUrl = null
        }
      }

      navigation.replace(page, routeParams)
    },
    [navigation, email, password, twitterInfo, instagramInfo]
  )

  const validateHandle = useCallback(
    (type: 'twitter' | 'instagram') => {
      const { profile } = type === 'twitter' ? twitterInfo : instagramInfo
      const handle = type === 'twitter' ? profile.screen_name : profile.username
      const verified =
        type === 'twitter' ? profile.verified : profile.is_verified
      dispatchWeb({
        type: MessageType.SIGN_UP_VALIDATE_HANDLE,
        handle,
        verified,
        isAction: true,
        onValidate: null
      })
    },
    [dispatchWeb, twitterInfo, instagramInfo]
  )

  const trackOAuthComplete = useCallback(
    (type: 'twitter' | 'instagram') => {
      const { profile } = type === 'twitter' ? twitterInfo : instagramInfo
      const handle = type === 'twitter' ? profile.screen_name : profile.username
      const isVerified =
        type === 'twitter' ? profile.verified : profile.is_verified
      const eventName =
        type === 'twitter'
          ? EventNames.CREATE_ACCOUNT_COMPLETE_TWITTER
          : EventNames.CREATE_ACCOUNT_COMPLETE_INSTAGRAM

      track(
        make({
          eventName,
          isVerified,
          emailAddress: email,
          handle
        })
      )
    },
    [twitterInfo, instagramInfo, email]
  )

  const signUp = useCallback(() => {
    const signUpParams: any = { email, password }
    if (twitterInfo) {
      signUpParams.twitterId = twitterInfo.twitterId
      signUpParams.name = twitterInfo.profile.name
      signUpParams.handle = twitterInfo.profile.screen_name
      signUpParams.twitterScreenName = twitterInfo.profile.screen_name
      signUpParams.verified = twitterInfo.profile.verified
      signUpParams.profilePictureUrl =
        twitterInfo.profile.profile_image_url_https ?? null
      signUpParams.coverPhotoUrl =
        twitterInfo.profile.profile_banner_url ?? null
    } else if (instagramInfo) {
      signUpParams.instagramId = instagramInfo.instagramId
      signUpParams.name = instagramInfo.profile.full_name
      signUpParams.handle = instagramInfo.profile.username
      signUpParams.instagramScreenName = instagramInfo.profile.username
      signUpParams.verified = instagramInfo.profile.is_verified
      signUpParams.profilePictureUrl =
        instagramInfo.profile.profile_pic_url_hd ?? null
      signUpParams.coverPhotoUrl = null
    }

    dispatchWeb({
      type: MessageType.SUBMIT_SIGNUP,
      ...signUpParams,
      accountAlreadyExisted: false,
      referrer: null,
      isAction: true
    })
  }, [dispatchWeb, email, password, twitterInfo, instagramInfo])

  useEffect(() => {
    if (!hasNavigatedAway && twitterInfo) {
      if (!handleIsValid && !didValidateHandle) {
        validateHandle('twitter')
        setDidValidateHandle(true)
      } else if (handleError || twitterInfo.requiresUserReview) {
        trackOAuthComplete('twitter')
        goTo('ProfileManual')
        setHasNavigatedAway(true)
        setIsLoading(false)
      } else if (handleIsValid) {
        trackOAuthComplete('twitter')
        signUp()
        goTo('FirstFollows')
        setHasNavigatedAway(true)
        setIsLoading(false)
      }
    }
  }, [
    hasNavigatedAway,
    twitterInfo,
    handleIsValid,
    handleError,
    didValidateHandle,
    validateHandle,
    signUp,
    goTo,
    trackOAuthComplete
  ])

  useEffect(() => {
    if (twitterError) {
      setIsLoading(false)
    }
  }, [twitterError])

  useEffect(() => {
    if (!hasNavigatedAway && instagramInfo) {
      if (!handleIsValid && !didValidateHandle) {
        validateHandle('instagram')
        setDidValidateHandle(true)
      } else if (handleError || instagramInfo.requiresUserReview) {
        trackOAuthComplete('instagram')
        goTo('ProfileManual')
        setHasNavigatedAway(true)
        setIsLoading(false)
      } else if (handleIsValid) {
        trackOAuthComplete('instagram')
        signUp()
        goTo('FirstFollows')
        setHasNavigatedAway(true)
        setIsLoading(false)
      }
    }
  }, [
    hasNavigatedAway,
    instagramInfo,
    handleIsValid,
    handleError,
    didValidateHandle,
    validateHandle,
    signUp,
    goTo,
    trackOAuthComplete
  ])

  useEffect(() => {
    if (instagramError) {
      setIsLoading(false)
    }
  }, [instagramError])

  const onTwitterPress = () => {
    setIsLoading(true)
    dispatch(oauthActions.setTwitterError(null))
    dispatchWeb({
      type: MessageType.REQUEST_TWITTER_AUTH,
      isAction: true
    })
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TWITTER,
        emailAddress: email
      })
    )
  }

  const onInstagramPress = () => {
    setIsLoading(true)
    dispatch(oauthActions.setInstagramError(null))
    dispatchWeb({
      type: MessageType.REQUEST_INSTAGRAM_AUTH,
      isAction: true
    })
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_INSTAGRAM,
        emailAddress: email
      })
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: 'white' }}>
      <SignupHeader />
      <View style={styles.container}>
        {isLoading ? (
          <View style={(styles.containerForm, { flex: 0.75 })}>
            <FormTitle />
            <View style={styles.loadingIcon}>
              <LottieView
                source={require('../../assets/animations/loadingSpinner.json')}
                autoPlay
                loop
                colorFilters={[
                  {
                    keypath: 'Shape Layer 1',
                    color: spinnerColor
                  },
                  {
                    keypath: 'Shape Layer 2',
                    color: spinnerColor
                  }
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.containerForm}>
            <FormTitle />
            {Dimensions.get('window').height < 670 ? (
              <Text
                style={[
                  styles.instruction,
                  { paddingLeft: 0, paddingRight: 0, paddingTop: 0 }
                ]}
              >
                {messages.description}
              </Text>
            ) : null}

            <TwitterButton onPress={onTwitterPress} />
            <InstagramButton onPress={onInstagramPress} />

            <View
              style={{
                borderBottomColor: '#ddd',
                borderBottomWidth: StyleSheet.hairlineWidth,
                width: '60%',
                marginTop: 16
              }}
            />

            {Dimensions.get('window').height < 670 ? (
              <Text style={[styles.instructionLong]}>
                {messages.descriptionLong}
              </Text>
            ) : (
              <Text style={styles.instruction}>{messages.description}</Text>
            )}

            {Dimensions.get('window').height > 670 ? (
              <View style={styles.bulletsContainer}>
                {[...Array(messages.oauthChecks.length)].map((_, i) => (
                  <BulletPoint key={i} i={i} />
                ))}
                <Text style={styles.ifApplicable}>{messages.ifApplicable}</Text>
              </View>
            ) : null}

            <View
              style={{
                borderBottomColor: '#ddd',
                borderBottomWidth: StyleSheet.hairlineWidth,
                width: '60%',
                marginBottom: 16
              }}
            />

            <TouchableOpacity
              style={styles.gotoManualBtn}
              activeOpacity={0.6}
              onPress={() => goTo('ProfileManual')}
            >
              <Text style={styles.gotoManualBtnTitle}>{messages.manually}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default ProfileAuto
