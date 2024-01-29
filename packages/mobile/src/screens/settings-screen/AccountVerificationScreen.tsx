import { useCallback, useEffect, useState } from 'react'

import { Status, accountSelectors, BooleanKeys } from '@audius/common'
import * as signOnActions from 'common/store/pages/signon/actions'
import { getHandleField } from 'common/store/pages/signon/selectors'
import type { EditableField } from 'common/store/pages/signon/types'
import { EditingStatus } from 'common/store/pages/signon/types'
import { Image, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import PartyFace from 'app/assets/images/emojis/face-with-party-horn-and-party-hat.png'
import { IconInstagram } from '@audius/harmony-native'
import { IconNote } from '@audius/harmony-native'
import { IconTwitter } from '@audius/harmony-native'
import { Button, Screen, ScreenContent, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { SocialButton } from 'app/components/social-button'
import { StatusMessage } from 'app/components/status-message'
import { TikTokAuthButton } from 'app/components/tiktok-auth'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { track, make } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import {
  getAbandoned,
  getInstagramError,
  getInstagramInfo,
  getTikTokError,
  getTwitterError,
  getTwitterInfo
} from 'app/store/oauth/selectors'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
const { getAccountUser } = accountSelectors

const messages = {
  title: 'Verification',
  gettingVerified:
    'Getting verified on Audius is easy! Just link your verified Instagram, TikTok or legacy verified Twitter account and you’ll be verified immediately.',
  handleMatch:
    'Your Audius handle must exactly match the verified handle you’re connecting.',
  verified: "You're verified!",
  verifyTwitter: 'Verify with Twitter',
  verifyInstagram: 'Verify with Instagram',
  verifyTikTok: 'Verify with TikTok',
  backButtonText: 'Back To The Music',
  failureText: 'Sorry, unable to retrieve information'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  contentContainer: {
    paddingTop: spacing(32),
    paddingBottom: spacing(8),
    paddingHorizontal: spacing(6)
  },
  text: {
    fontSize: 18,
    marginBottom: spacing(6),
    textAlign: 'center'
  },
  verifiedHeader: {
    color: palette.secondary,
    marginBottom: spacing(4),
    fontSize: 32,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: typography.fontByWeight.heavy
  },
  socialButtonContainer: {
    marginBottom: spacing(2)
  },
  profileContainer: {
    marginTop: spacing(12),
    marginBottom: spacing(21),
    alignItems: 'center'
  },
  profilePicture: {
    marginBottom: spacing(2)
  },
  profileName: {
    fontSize: 20
  },
  profileHandle: {
    fontSize: 16
  },
  successEmoji: {
    height: 48,
    width: 48,
    alignSelf: 'center',
    marginBottom: spacing(2)
  },
  buttonContainer: {
    marginTop: spacing(3),
    marginBottom: spacing(3),
    height: 64,
    minWidth: 300
  },
  twitterButton: {
    backgroundColor: palette.staticTwitterBlue
  },
  button: {
    paddingHorizontal: spacing(4)
  },
  buttonText: {
    fontSize: 18
  },
  buttonIcon: {
    marginRight: spacing(3)
  }
}))

export const AccountVerificationScreen = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const [error, setError] = useState('')
  const [status, setStatus] = useState<Status>(Status.IDLE)
  const [didValidateHandle, setDidValidateHandle] = useState(false)
  const accountUser = useSelector(getAccountUser)
  const navigation = useNavigation()
  const twitterInfo = useSelector(getTwitterInfo)
  const twitterError = useSelector(getTwitterError)
  const instagramInfo = useSelector(getInstagramInfo)
  const instagramError = useSelector(getInstagramError)
  const tikTokError = useSelector(getTikTokError)
  const abandoned = useSelector(getAbandoned)

  const isTwitterEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TWITTER_VERIFICATION
  )
  const isInstagramEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION
  )
  const isTikTokEnabled = useRemoteVar(BooleanKeys.DISPLAY_TIKTOK_VERIFICATION)

  const handleField: EditableField = useSelector(getHandleField)

  const accountName = accountUser?.name
  const accountHandle = accountUser?.handle

  const onVerifyButtonPress = useCallback(() => {
    setStatus(Status.LOADING)
  }, [setStatus])

  const onVerifyFailure = useCallback(() => {
    setError(messages.failureText)
    setStatus(Status.ERROR)
  }, [setError, setStatus])

  const validateHandle = useCallback(
    (type: 'twitter' | 'instagram') => {
      const info = type === 'twitter' ? twitterInfo : instagramInfo
      if (!info) return

      const { profile } = info
      const handle = type === 'twitter' ? profile.screen_name : profile.username
      const verified =
        type === 'twitter' ? profile.verified : profile.is_verified

      dispatch(signOnActions.validateHandle(accountHandle ?? handle, verified))
    },
    [accountHandle, dispatch, twitterInfo, instagramInfo]
  )

  const trackOAuthComplete = useCallback(
    (type: 'twitter' | 'instagram') => {
      const info = type === 'twitter' ? twitterInfo : instagramInfo
      if (!info || !accountHandle) return
      const { profile } = info

      if (type === 'twitter') {
        const { screen_name, verified: is_verified } = profile
        track(
          make({
            eventName: EventNames.SETTINGS_COMPLETE_TWITTER_OAUTH,
            screen_name,
            is_verified,
            handle: accountHandle
          })
        )
      } else {
        const { username, verified: is_verified } = profile
        track(
          make({
            eventName: EventNames.SETTINGS_COMPLETE_INSTAGRAM_OAUTH,
            username,
            is_verified,
            handle: accountHandle
          })
        )
      }
    },
    [twitterInfo, instagramInfo, accountHandle]
  )

  useEffect(() => {
    if (twitterInfo) {
      if (handleField.status !== EditingStatus.SUCCESS && !didValidateHandle) {
        validateHandle('twitter')
        setDidValidateHandle(true)
      } else if (handleField.error || twitterInfo.requiresUserReview) {
        trackOAuthComplete('twitter')
        setStatus(Status.IDLE)
      } else if (handleField.status === EditingStatus.SUCCESS) {
        trackOAuthComplete('twitter')
        setStatus(Status.SUCCESS)
      }
    }
  }, [
    twitterInfo,
    handleField,
    didValidateHandle,
    validateHandle,
    trackOAuthComplete
  ])

  useEffect(() => {
    if (twitterError || instagramError || tikTokError) {
      onVerifyFailure()
    }
  }, [onVerifyFailure, twitterError, instagramError, tikTokError])

  useEffect(() => {
    if (instagramInfo) {
      if (handleField.status !== EditingStatus.SUCCESS && !didValidateHandle) {
        validateHandle('instagram')
        setDidValidateHandle(true)
      } else if (handleField.error || instagramInfo.requiresUserReview) {
        trackOAuthComplete('instagram')
        setStatus(Status.IDLE)
      } else if (handleField.status === EditingStatus.SUCCESS) {
        trackOAuthComplete('instagram')
        setStatus(Status.SUCCESS)
      }
    }
  }, [
    instagramInfo,
    handleField,
    didValidateHandle,
    validateHandle,
    trackOAuthComplete
  ])

  const handleTwitterPress = () => {
    if (!accountHandle) return
    onVerifyButtonPress()
    dispatch(oauthActions.setTwitterError(null))
    dispatch(oauthActions.twitterAuth())
    track(
      make({
        eventName: EventNames.SETTINGS_START_TWITTER_OAUTH,
        handle: accountHandle
      })
    )
  }

  const handleInstagramPress = () => {
    if (!accountHandle) return
    onVerifyButtonPress()
    dispatch(oauthActions.setInstagramError(null))
    dispatch(oauthActions.instagramAuth())
    track(
      make({
        eventName: EventNames.SETTINGS_START_INSTAGRAM_OAUTH,
        handle: accountHandle
      })
    )
  }

  const handleTikTokPress = () => {
    if (!accountHandle) return
    onVerifyButtonPress()
    dispatch(oauthActions.setTikTokError(null))
    dispatch(oauthActions.tikTokAuth())
    track(
      make({
        eventName: EventNames.SETTINGS_START_TIKTOK_OAUTH,
        handle: accountHandle
      })
    )
  }

  useEffect(() => {
    if (abandoned) {
      setStatus(Status.IDLE)
    }
  }, [abandoned])

  const goBacktoProfile = useCallback(() => {
    if (!accountHandle) return
    navigation.navigate('Profile', { handle: accountHandle })
  }, [accountHandle, navigation])

  if (!accountUser) return null

  const loadingView = (
    <LoadingSpinner style={{ alignSelf: 'center', marginVertical: 16 }} />
  )

  const verifyView = (
    <View style={styles.contentContainer}>
      <Text style={styles.text}>{messages.gettingVerified}</Text>
      <Text style={styles.text}>{messages.handleMatch}</Text>

      {isTwitterEnabled ? (
        <SocialButton
          color={'#1BA1F1'}
          fullWidth
          icon={IconTwitter}
          onPress={handleTwitterPress}
          styles={{ root: styles.socialButtonContainer }}
          title={messages.verifyTwitter}
        />
      ) : null}

      {isInstagramEnabled ? (
        <SocialButton
          fullWidth
          icon={IconInstagram}
          onPress={handleInstagramPress}
          styles={{ root: styles.socialButtonContainer }}
          title={messages.verifyInstagram}
        />
      ) : null}

      {isTikTokEnabled ? (
        <TikTokAuthButton
          onPress={handleTikTokPress}
          styles={{ root: styles.socialButtonContainer }}
          title={messages.verifyTikTok}
        />
      ) : null}
      {error ? (
        <StatusMessage
          style={{ alignSelf: 'center' }}
          label={messages.failureText}
          status='error'
        />
      ) : null}
    </View>
  )

  const successView = (
    <View style={styles.contentContainer}>
      <View>
        <Image style={styles.successEmoji} source={PartyFace} />
      </View>
      <Text style={styles.verifiedHeader} variant='h1'>
        {messages.verified}
      </Text>
      <View style={styles.profileContainer}>
        <ProfilePicture profile={accountUser} style={styles.profilePicture} />
        <Text style={styles.profileName} variant='h1'>
          {accountName}
          <UserBadges user={accountUser} badgeSize={12} hideName />
        </Text>
        <Text style={styles.profileHandle}>@{accountHandle}</Text>
      </View>
      <Button
        variant='commonAlt'
        title={messages.backButtonText}
        size='large'
        styles={{
          root: [styles.buttonContainer],
          text: styles.buttonText,
          button: styles.button
        }}
        onPress={goBacktoProfile}
        icon={IconNote}
        iconPosition='right'
      />
    </View>
  )

  const getPageContent = () => {
    switch (status) {
      case Status.IDLE:
      case Status.ERROR:
        return verifyView
      case Status.LOADING:
        return loadingView
      default:
        return successView
    }
  }

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <ScreenContent>{getPageContent()}</ScreenContent>
    </Screen>
  )
}
