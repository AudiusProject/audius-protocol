import { useCallback, useEffect, useMemo, useState } from 'react'

import { FeatureFlags, formatTikTokProfile } from '@audius/common'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField
} from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import type { EditableField } from 'common/store/pages/signon/types'
import { Animated, View, TouchableOpacity, SafeAreaView } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconImage from 'app/assets/images/iconImage.svg'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTikTok from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitter from 'app/assets/images/iconTwitterBird.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import { Button, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useTikTokAuth } from 'app/hooks/useTikTokAuth'
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
  socialButton: {
    padding: spacing(3),
    height: 64
  },
  buttonText: {
    fontSize: 20
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
  manual: "I'd rather fill out my profile manually"
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
  const { neutralLight4, staticWhite } = useThemeColors()
  const twitterInfo = useSelector(getTwitterInfo)
  const twitterError = useSelector(getTwitterError)
  const instagramInfo = useSelector(getInstagramInfo)
  const instagramError = useSelector(getInstagramError)
  const tikTokInfo = useSelector(getTikTokInfo)
  const tikTokError = useSelector(getTikTokError)
  const abandoned = useSelector(getAbandoned)
  const handleField: EditableField = useSelector(getHandleField)
  const emailField: EditableField = useSelector(getEmailField)
  const { isEnabled: isTikTokEnabled } = useFeatureFlag(
    FeatureFlags.COMPLETE_PROFILE_WITH_TIKTOK
  )
  const withTikTokAuth = useTikTokAuth({
    onError: (error) => {
      dispatch(oauthActions.setTikTokError(error))
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false)
  const [didValidateHandle, setDidValidateHandle] = useState(false)

  const goTo = useCallback(
    (page: 'ProfileManual' | 'FirstFollows') => {
      navigation.replace(page)
    },
    [navigation]
  )

  const validateHandle = useCallback(
    (handle: string, verified: boolean) => {
      dispatch(signOnActions.validateHandle(handle, verified))
    },
    [dispatch]
  )

  const trackOAuthComplete = useCallback(
    (eventName: string, handle: string, isVerified: boolean) => {
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
      dispatch(
        signOnActions.setTwitterProfile(
          twitterInfo.twitterId,
          twitterInfo.profile,
          twitterInfo.profile.profile_image_url_https
            ? {
                // Replace twitter's returned image (which may vary) with the hd one
                uri: twitterInfo.profile.profile_image_url_https.replace(
                  /_(normal|bigger|mini)/g,
                  ''
                ),
                name: 'ProfileImage',
                type: 'image/jpeg'
              }
            : null,
          twitterInfo.profile.profile_banner_url
            ? {
                uri: twitterInfo.profile.profile_banner_url,
                name: 'ProfileBanner',
                type: 'image/png'
              }
            : null
        )
      )
    } else if (instagramInfo) {
      dispatch(
        signOnActions.setInstagramProfile(
          instagramInfo.instagramId,
          instagramInfo.profile,
          instagramInfo.profile.profile_pic_url_hd
            ? {
                uri: instagramInfo.profile.profile_pic_url_hd,
                name: 'ProfileImage',
                type: 'image/jpeg'
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
                uri: tikTokInfo.profile.avatar_large_url,
                name: 'ProfileImage',
                type: 'image/jpeg'
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
      completeEvent: string
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
        goTo('ProfileManual')
        setHasNavigatedAway(true)
        setIsLoading(false)
      } else if (handleField.status === EditingStatus.SUCCESS) {
        trackOAuthComplete(completeEvent, handle, verified)
        setOAuthInfo()
        signUp()
        goTo('FirstFollows')
        setHasNavigatedAway(true)
        setIsLoading(false)
      }
    },
    [
      handleField,
      didValidateHandle,
      validateHandle,
      setOAuthInfo,
      signUp,
      goTo,
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
    if (twitterError | instagramError | tikTokError) {
      setIsLoading(false)
      // TODO: sk - show an error message?
    }
  }, [twitterError, instagramError, tikTokError])

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
    setIsLoading(true)

    withTikTokAuth(async (accessToken: string) => {
      try {
        // Using TikTok v1 api because v2 does not have CORS headers set
        const result = await fetch(
          `https://open-api.tiktok.com/user/info/?access_token=${accessToken}`,
          {
            method: 'POST',
            body: JSON.stringify({
              fields: [
                'open_id',
                'username',
                'display_name',
                'avatar_large_url',
                'is_verified'
              ]
            })
          }
        )

        const resultJson = await result.json()
        const tikTokProfile = resultJson.data.user

        const { profile, profileImage, requiresUserReview } =
          await formatTikTokProfile(tikTokProfile, async (image: File) => image)

        dispatch(
          oauthActions.setTikTokInfo(
            tikTokProfile.open_id,
            profile,
            profileImage,
            requiresUserReview
          )
        )
      } catch (e) {
        console.log(e)
      }
    })

    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TIKTOK,
        emailAddress: emailField.value
      })
    )
  }

  useEffect(() => {
    if (abandoned) {
      setIsLoading(false)
    }
  }, [abandoned])

  const socialButtonStyles = useMemo(
    () => ({
      icon: { height: 20, width: 20, marginRight: 12 },
      button: [styles.socialButton],
      root: styles.socialButtonContainer,
      text: styles.buttonText
    }),
    [styles]
  )

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

            <Button
              color={'#1BA1F1'}
              fullWidth
              icon={IconTwitter}
              iconPosition={'left'}
              onPress={handleTwitterPress}
              styles={socialButtonStyles}
              title={messages.twitterButton}
            />
            <Button
              fullWidth
              icon={IconInstagram}
              iconPosition={'left'}
              onPress={handleInstagramPress}
              styles={socialButtonStyles}
              title={messages.instagramButton}
            />
            {isTikTokEnabled ? (
              <Button
                color={'#FE2C55'}
                fullWidth
                icon={IconTikTok}
                iconPosition={'left'}
                onPress={handleTikTokPress}
                styles={socialButtonStyles}
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
                />
                <Text variant={'h4'} noGutter style={styles.tileListItemText}>
                  {messages.verifiedTileContent}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => goTo('ProfileManual')}
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
