import { useCallback, useEffect, useState } from 'react'

import type { Name } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField
} from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import type { EditableField } from 'common/store/pages/signon/types'
import { Animated, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'

import IconImage from 'app/assets/images/iconImage.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTwitter from 'app/assets/images/iconTwitterBird.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { SocialButton } from 'app/components/social-button'
import { TikTokAuthButton } from 'app/components/tiktok-auth'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import { track, make } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import {
  getInstagramError,
  getInstagramInfo,
  getTikTokError,
  getTikTokInfo,
  getTwitterError,
  getTwitterInfo,
  getAbandoned
} from 'app/store/oauth/selectors'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import SignupHeader from './SignupHeader'
import type { SignOnStackParamList } from './types'

const useStyles = makeStyles(({ palette, spacing }) => ({
  screen: {
    width: '100%',
    height: '100%',
    backgroundColor: palette.staticWhite
  },
  container: {
    alignItems: 'center',
    padding: spacing(7),
    height: '100%'
  },
  header: {
    color: palette.secondary,
    textAlign: 'center',
    paddingBottom: spacing(2)
  },
  socialButtonContainer: {
    marginBottom: spacing(2)
  },
  tile: {
    width: '100%',
    backgroundColor: palette.neutralLight10,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: 8,
    padding: spacing(4),
    marginBottom: spacing(6)
  },
  tileHeader: { marginBottom: spacing(1), textTransform: 'uppercase' },
  tileListItem: {
    marginTop: spacing(2),
    flexDirection: 'row',
    alignItems: 'center'
  },
  tileListItemText: {
    flex: 1,
    lineHeight: 21
  },
  tileListItemIconCircle: {
    marginRight: spacing(2),
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.secondary,
    borderRadius: 100
  },
  verifiedIcon: {
    marginRight: spacing(4)
  },
  manualButton: {
    marginTop: 'auto',
    marginBottom: spacing(7)
  },
  manualButtonText: {
    color: palette.secondaryLight2
  },
  loadingIcon: {
    alignItems: 'center',
    marginTop: 48,
    height: 48
  }
}))

const messages = {
  instagramButton: 'Complete with Instagram',
  twitterButton: 'Complete with Twitter',
  tiktokButton: 'Complete with TikTok',
  header: 'Quickly Complete Your Account by Linking Your Other Socials',
  importTileHeader: 'We will import these details',
  importTileItemHandle: 'Handle & Display Name',
  importTileItemPicture: 'Profile Picture & Cover Photo',
  verifiedTileHeader: 'Verified?',
  verifiedTileContent:
    'If the linked account is verified, your Audius account will be verified to match!',
  manual: "I'd rather fill out my profile manually",
  error: 'Something went wrong, please try again'
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
      <Text variant={'h1'} style={styles.header}>
        {messages.header}
      </Text>
    </Animated.View>
  )
}

type ProfileAutoProps = NativeStackScreenProps<
  SignOnStackParamList,
  'ProfileAuto'
>
const ProfileAuto = ({ navigation }: ProfileAutoProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { neutralLight4, staticWhite, staticPrimary } = useThemeColors()
  const twitterInfo = useSelector(getTwitterInfo)
  const twitterError = useSelector(getTwitterError)
  const instagramInfo = useSelector(getInstagramInfo)
  const instagramError = useSelector(getInstagramError)
  const tikTokInfo = useSelector(getTikTokInfo)
  const tikTokError = useSelector(getTikTokError)
  const abandoned = useSelector(getAbandoned)
  const handleField: EditableField = useSelector(getHandleField)
  const emailField: EditableField = useSelector(getEmailField)
  const isTwitterEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TWITTER_VERIFICATION
  )
  const isInstagramEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION
  )
  const isTikTokEnabled = useRemoteVar(BooleanKeys.DISPLAY_TIKTOK_VERIFICATION)
  const [isLoading, setIsLoading] = useState(false)
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false)
  const [didValidateHandle, setDidValidateHandle] = useState(false)

  const validateHandle = useCallback(
    (handle: string, verified: boolean) => {
      dispatch(signOnActions.validateHandle(handle, verified))
    },
    [dispatch]
  )

  const trackOAuthComplete = useCallback(
    (
      eventName:
        | Name.CREATE_ACCOUNT_COMPLETE_TWITTER
        | Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM
        | Name.CREATE_ACCOUNT_COMPLETE_TIKTOK,
      handle: string,
      isVerified: boolean
    ) => {
      track(
        make({
          eventName,
          isVerified,
          emailAddress: emailField.value,
          handle
        })
      )
    },
    [emailField]
  )

  const setOAuthInfo = useCallback(() => {
    if (twitterInfo) {
      // Replace twitter's returned image (which may vary) with the hd one
      const twitterProfileImageUrl = twitterInfo.profile.profile_image_url_https
        ? twitterInfo.profile.profile_image_url_https.replace(
            /_(normal|bigger|mini)/g,
            ''
          )
        : null
      dispatch(
        signOnActions.setTwitterProfile(
          twitterInfo.uuid,
          twitterInfo.profile,
          twitterProfileImageUrl
            ? {
                url: twitterProfileImageUrl,
                file: {
                  uri: twitterProfileImageUrl,
                  name: 'ProfileImage',
                  type: 'image/jpeg'
                }
              }
            : null,
          twitterInfo.profile.profile_banner_url
            ? {
                url: twitterInfo.profile.profile_banner_url,
                file: {
                  uri: twitterInfo.profile.profile_banner_url,
                  name: 'ProfileBanner',
                  type: 'image/png'
                }
              }
            : null
        )
      )
    } else if (instagramInfo) {
      dispatch(
        signOnActions.setInstagramProfile(
          instagramInfo.uuid,
          instagramInfo.profile,
          instagramInfo.profile.profile_pic_url_hd
            ? {
                url: instagramInfo.profile.profile_pic_url_hd,
                file: {
                  uri: instagramInfo.profile.profile_pic_url_hd,
                  name: 'ProfileImage',
                  type: 'image/jpeg'
                }
              }
            : null
        )
      )
    } else if (tikTokInfo) {
      dispatch(
        signOnActions.setTikTokProfile(
          tikTokInfo.uuid,
          tikTokInfo.profile,
          tikTokInfo.profile.avatar_large_url
            ? {
                url: tikTokInfo.profile.avatar_large_url,
                file: {
                  uri: tikTokInfo.profile.avatar_large_url,
                  name: 'ProfileImage',
                  type: 'image/jpeg'
                }
              }
            : null
        )
      )
    }
  }, [dispatch, twitterInfo, instagramInfo, tikTokInfo])

  const signUp = useCallback(() => {
    dispatch(signOnActions.signUp())
  }, [dispatch])

  const handleProfileSet = useCallback(
    ({
      completeEvent,
      handle,
      verified,
      requiresUserReview
    }: {
      completeEvent:
        | Name.CREATE_ACCOUNT_COMPLETE_TWITTER
        | Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM
        | Name.CREATE_ACCOUNT_COMPLETE_TIKTOK
      handle: string
      verified: boolean
      requiresUserReview: boolean
    }) => {
      if (handleField.status !== EditingStatus.SUCCESS && !didValidateHandle) {
        validateHandle(handle, verified)
        setDidValidateHandle(true)
      } else if (
        handleField.status === EditingStatus.FAILURE ||
        requiresUserReview
      ) {
        trackOAuthComplete(completeEvent, handle, verified)
        setOAuthInfo()
        navigation.push('ProfileManual')
        setHasNavigatedAway(true)
        setIsLoading(false)
      } else if (handleField.status === EditingStatus.SUCCESS) {
        trackOAuthComplete(completeEvent, handle, verified)
        setOAuthInfo()
        signUp()
        track(
          make({
            eventName: EventNames.CREATE_ACCOUNT_COMPLETE_PROFILE,
            emailAddress: emailField.value,
            handle
          })
        )
        navigation.push('FirstFollows')
        setHasNavigatedAway(true)
        setIsLoading(false)
      }
    },
    [
      handleField,
      emailField,
      didValidateHandle,
      validateHandle,
      setOAuthInfo,
      signUp,
      navigation,
      trackOAuthComplete
    ]
  )

  useEffect(() => {
    if (!hasNavigatedAway) {
      if (twitterInfo) {
        handleProfileSet({
          completeEvent: EventNames.CREATE_ACCOUNT_COMPLETE_TWITTER,
          handle: twitterInfo.profile.screen_name,
          verified: twitterInfo.profile.verified,
          requiresUserReview: twitterInfo.requiresUserReview
        })
      } else if (instagramInfo) {
        handleProfileSet({
          completeEvent: EventNames.CREATE_ACCOUNT_COMPLETE_INSTAGRAM,
          handle: instagramInfo.profile.username,
          verified: instagramInfo.profile.is_verified,
          requiresUserReview: instagramInfo.requiresUserReview
        })
      } else if (tikTokInfo) {
        handleProfileSet({
          completeEvent: EventNames.CREATE_ACCOUNT_COMPLETE_TIKTOK,
          handle: tikTokInfo.profile.username,
          verified: tikTokInfo.profile.is_verified,
          requiresUserReview: tikTokInfo.requiresUserReview
        })
      }
    }
  }, [
    hasNavigatedAway,
    twitterInfo,
    instagramInfo,
    tikTokInfo,
    handleProfileSet
  ])

  useEffect(() => {
    if (twitterError || instagramError || tikTokError) {
      setIsLoading(false)
      toast({ content: messages.error })
    }
  }, [twitterError, instagramError, tikTokError, toast])

  const handleTwitterPress = () => {
    setIsLoading(true)

    dispatch(oauthActions.setTwitterError(null))
    dispatch(oauthActions.twitterAuth())
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TWITTER,
        emailAddress: emailField.value
      })
    )
  }

  const handleInstagramPress = () => {
    setIsLoading(true)
    dispatch(oauthActions.setInstagramError(null))
    dispatch(oauthActions.instagramAuth())
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_INSTAGRAM,
        emailAddress: emailField.value
      })
    )
  }

  const handleTikTokPress = () => {
    dispatch(oauthActions.setTikTokError(null))
    setIsLoading(true)
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TIKTOK,
        emailAddress: emailField.value
      })
    )
  }

  const handlePressManual = useCallback(() => {
    navigation.push('ProfileManual')
  }, [navigation])

  useEffect(() => {
    if (abandoned) {
      setIsLoading(false)
    }
  }, [abandoned])

  return (
    <SafeAreaView style={styles.screen}>
      <SignupHeader />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingIcon}>
            <LoadingSpinner fill={neutralLight4} />
          </View>
        ) : (
          <>
            <FormTitle />

            <View style={styles.tile}>
              <Text variant={'h3'} style={styles.tileHeader}>
                {messages.importTileHeader}
              </Text>
              <View style={[styles.tileListItem]}>
                <View style={styles.tileListItemIconCircle}>
                  <IconUser fill={staticWhite} height={16} width={16} />
                </View>
                <Text variant={'h4'} noGutter style={styles.tileListItemText}>
                  {messages.importTileItemHandle}
                </Text>
              </View>
              <View style={[styles.tileListItem]}>
                <View style={styles.tileListItemIconCircle}>
                  <IconImage fill={staticWhite} height={16} width={16} />
                </View>
                <Text variant={'h4'} noGutter style={styles.tileListItemText}>
                  {messages.importTileItemPicture}
                </Text>
              </View>
            </View>

            {isTwitterEnabled ? (
              <SocialButton
                color={'#1BA1F1'}
                fullWidth
                icon={IconTwitter}
                onPress={handleTwitterPress}
                styles={{ root: styles.socialButtonContainer }}
                title={messages.twitterButton}
              />
            ) : null}
            {isInstagramEnabled ? (
              <SocialButton
                fullWidth
                icon={IconInstagram}
                onPress={handleInstagramPress}
                styles={{ root: styles.socialButtonContainer }}
                title={messages.instagramButton}
              />
            ) : null}
            {isTikTokEnabled ? (
              <TikTokAuthButton
                onPress={handleTikTokPress}
                noText={false}
                styles={{ root: styles.socialButtonContainer }}
                title={messages.tiktokButton}
              />
            ) : null}

            <View style={[styles.tile, { marginTop: 16 }]}>
              <Text variant={'h3'} style={styles.tileHeader}>
                {messages.verifiedTileHeader}
              </Text>
              <View style={[styles.tileListItem]}>
                <IconVerified
                  height={24}
                  width={24}
                  style={styles.verifiedIcon}
                  fill={staticPrimary}
                  fillSecondary={staticWhite}
                />
                <Text variant={'h4'} noGutter style={styles.tileListItemText}>
                  {messages.verifiedTileContent}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handlePressManual}
              style={styles.manualButton}
            >
              <Text
                fontSize='medium'
                weight='medium'
                style={styles.manualButtonText}
              >
                {messages.manual}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

export default ProfileAuto
