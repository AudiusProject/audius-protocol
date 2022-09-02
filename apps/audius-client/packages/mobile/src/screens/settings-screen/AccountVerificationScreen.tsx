import { useCallback, useEffect, useState } from 'react'

import { Status, accountSelectors } from '@audius/common'
import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'
import { getHandleField } from 'common/store/pages/signon/selectors'
import type { EditableField } from 'common/store/pages/signon/types'
import { EditingStatus } from 'common/store/pages/signon/types'
import { Image, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import PartyFace from 'app/assets/images/emojis/face-with-party-horn-and-party-hat.png'
import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconTwitter from 'app/assets/images/iconTwitterBird.svg'
import { Button, Screen, Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { StatusMessage } from 'app/components/status-message'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { MessageType } from 'app/message'
import { track, make } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import {
  getInstagramError,
  getInstagramInfo,
  getTwitterError,
  getTwitterInfo
} from 'app/store/oauth/selectors'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { getUserRoute } from 'app/utils/routes'
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  title: 'Verification',
  gettingVerified:
    'Getting verified on Audius is easy! Just link your verified Twitter or Instagram account and you’ll be verified immediately.',
  handleMatch:
    'Your Audius handle must exactly match the verified handle you’re connecting.',
  verified: "You're verified!",
  verifyTwitter: 'Verify with Twitter',
  verifyInstagram: 'Verify with Instagram',
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
  }
}))

export const AccountVerificationScreen = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [didValidateHandle, setDidValidateHandle] = useState(false)
  const accountUser = useSelector(getAccountUser)
  const navigation = useNavigation()
  const twitterInfo = useSelector(getTwitterInfo)
  const twitterError = useSelector(getTwitterError)
  const instagramInfo = useSelector(getInstagramInfo)
  const instagramError = useSelector(getInstagramError)

  const handleField: EditableField = useSelector(getHandleField)

  const name = accountUser?.name
  const handle = accountUser?.handle

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
      dispatch({
        type: MessageType.SIGN_UP_VALIDATE_HANDLE,
        handle,
        verified,
        isAction: true,
        onValidate: null
      })
    },
    [dispatch, twitterInfo, instagramInfo]
  )

  const trackOAuthComplete = useCallback(
    (type: 'twitter' | 'instagram') => {
      const info = type === 'twitter' ? twitterInfo : instagramInfo
      if (!info || !handle) return
      const { profile } = info

      if (type === 'twitter') {
        const { screen_name, verified: is_verified } = profile
        track(
          make({
            eventName: EventNames.SETTINGS_COMPLETE_TWITTER_OAUTH,
            screen_name,
            is_verified,
            handle
          })
        )
      } else {
        const { username, verified: is_verified } = profile
        track(
          make({
            eventName: EventNames.SETTINGS_COMPLETE_INSTAGRAM_OAUTH,
            username,
            is_verified,
            handle
          })
        )
      }
    },
    [twitterInfo, instagramInfo, handle]
  )

  useEffect(() => {
    if (twitterInfo) {
      if (handleField.status !== EditingStatus.SUCCESS && !didValidateHandle) {
        validateHandle('twitter')
        setDidValidateHandle(true)
      } else if (handleField.error || twitterInfo.requiresUserReview) {
        trackOAuthComplete('twitter')
        setStatus('')
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
    if (twitterError) onVerifyFailure()
  }, [onVerifyFailure, twitterError])

  useEffect(() => {
    if (instagramInfo) {
      if (handleField.status !== EditingStatus.SUCCESS && !didValidateHandle) {
        validateHandle('instagram')
        setDidValidateHandle(true)
      } else if (handleField.error || instagramInfo.requiresUserReview) {
        trackOAuthComplete('instagram')
        setStatus('')
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

  useEffect(() => {
    if (instagramError) onVerifyFailure()
  }, [instagramError, onVerifyFailure])

  const onTwitterPress = () => {
    if (!handle) return
    onVerifyButtonPress()
    dispatch(oauthActions.setTwitterError(null))
    dispatch({
      type: MessageType.REQUEST_TWITTER_AUTH,
      isAction: true
    })
    track(
      make({
        eventName: EventNames.SETTINGS_START_TWITTER_OAUTH,
        handle
      })
    )
  }

  const onInstagramPress = () => {
    if (!handle) return
    onVerifyButtonPress()
    dispatch(oauthActions.setInstagramError(null))
    dispatch({
      type: MessageType.REQUEST_INSTAGRAM_AUTH,
      isAction: true
    })
    track(
      make({
        eventName: EventNames.SETTINGS_START_INSTAGRAM_OAUTH,
        handle
      })
    )
  }

  const goBacktoProfile = useCallback(() => {
    if (!handle) return
    navigation.navigate({
      native: { screen: 'Profile', params: { handle } },
      web: { route: getUserRoute(accountUser), fromPage: NOTIFICATION_PAGE }
    })
  }, [accountUser, handle, navigation])

  if (!accountUser) return null

  const loadingView = (
    <LoadingSpinner style={{ alignSelf: 'center', marginVertical: 16 }} />
  )

  const verifyView = (
    <View style={styles.contentContainer}>
      <Text style={styles.text}>{messages.gettingVerified}</Text>
      <Text style={styles.text}>{messages.handleMatch}</Text>
      <Button
        title={messages.verifyTwitter}
        styles={{
          root: [styles.buttonContainer, styles.twitterButton],
          text: styles.buttonText,
          icon: styles.buttonIcon,
          button: styles.button
        }}
        onPress={onTwitterPress}
        icon={IconTwitter}
        iconPosition='left'
      />
      <Button
        title={messages.verifyInstagram}
        styles={{
          root: [styles.buttonContainer],
          text: styles.buttonText,
          icon: styles.buttonIcon,
          button: styles.button
        }}
        onPress={onInstagramPress}
        icon={IconInstagram}
        iconPosition='left'
      />
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
          {name}
          <UserBadges user={accountUser} badgeSize={12} hideName />
        </Text>
        <Text style={styles.profileHandle}>@{handle}</Text>
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
      case '':
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
      {getPageContent()}
    </Screen>
  )
}
