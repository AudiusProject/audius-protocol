import { useCallback, useState } from 'react'

import { Name, SquareSizes, Status, ID } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'
import {
  InstagramProfile,
  TwitterProfile,
  TikTokProfile,
  accountSelectors,
  accountActions
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconValidationX, IconNote, Button } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useRecord, make, TrackEvent } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { InstagramAuthButton } from 'components/instagram-auth/InstagramAuthButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { TikTokAuthButton } from 'components/tiktok-auth/TikTokAuthButton'
import { TwitterAuthButton } from 'components/twitter-auth/TwitterAuthButton'
import UserBadges from 'components/user-badges/UserBadges'
import { useProfilePicture } from 'hooks/useProfilePicture'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { push } from 'utils/navigation'

import settingsPageStyles from './SettingsPage.module.css'
import styles from './VerificationPage.module.css'

const { getUserId, getUserHandle, getUserName } = accountSelectors
const {
  twitterLogin: twitterLoginAction,
  instagramLogin: instagramLoginAction,
  tikTokLogin: tikTokLoginAction
} = accountActions
const { profilePage } = route

const messages = {
  title: 'VERIFICATION',
  instructions:
    'Getting verified on Audius is easy! Just link your verified Instagram, TikTok or legacy verified Twitter account and you’ll be verified immediately.',
  warning: (
    <span>
      {'Your Audius handle must '}
      <b>exactly</b> {' match the verified handle you’re connecting.'}
    </span>
  ),
  failure: 'Sorry, unable to retrieve information',
  errorHandle: 'Sorry, your handle does not match',
  errorVerifiedTwitter: 'Your Twitter account isn’t legacy verified',
  errorVerifiedInstagram: 'Your Instagram account isn’t verified',
  errorVerifiedTikTok: 'Your TikTok account isn’t verified',
  backToMusic: 'Back To The Music',
  verified: "YOU'RE VERIFIED!",
  twitterVerify: 'Verify with Twitter',
  instagramVerify: 'Verify with Instagram',
  tiktokVerify: 'Verify with TikTok'
}

type VerifyBodyProps = {
  handle: string
  onClick: () => void
  onFailure: () => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => void
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => void
  onTikTokLogin: (uuid: string, profile: TikTokProfile) => void
  error?: string
}

const VerifyBody = (props: VerifyBodyProps) => {
  const isTwitterEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TWITTER_VERIFICATION_WEB_AND_DESKTOP
  )
  const isInstagramEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP
  )
  const isTikTokEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TIKTOK_VERIFICATION_WEB_AND_DESKTOP
  )

  const record = useRecord()
  const { handle, onClick } = props
  const handleClickTwitter = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_TWITTER_OAUTH, {
      handle
    })
    record(trackEvent)
  }, [record, onClick, handle])

  const handleClickInstagram = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_INSTAGRAM_OAUTH, {
      handle
    })
    record(trackEvent)
  }, [record, onClick, handle])

  const handleClickTikTok = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_TIKTOK_OAUTH, {
      handle
    })
    record(trackEvent)
  }, [record, onClick, handle])

  return (
    <div className={styles.container}>
      <div className={styles.text}>{messages.instructions}</div>
      <div className={cn(styles.text, styles.warning)}>{messages.warning}</div>
      <div className={styles.btnContainer}>
        {isTwitterEnabled ? (
          <TwitterAuthButton
            onClick={handleClickTwitter}
            onSuccess={props.onTwitterLogin}
            onFailure={props.onFailure}
            css={{ width: '100%' }}
          >
            {messages.twitterVerify}
          </TwitterAuthButton>
        ) : null}
        {isInstagramEnabled ? (
          <InstagramAuthButton
            onClick={handleClickInstagram}
            onSuccess={props.onInstagramLogin}
            onFailure={props.onFailure}
            fullWidth
          >
            {messages.instagramVerify}
          </InstagramAuthButton>
        ) : null}
        {isTikTokEnabled ? (
          <TikTokAuthButton
            onClick={handleClickTikTok}
            onFailure={props.onFailure}
            onSuccess={props.onTikTokLogin}
          >
            {messages.tiktokVerify}
          </TikTokAuthButton>
        ) : null}
      </div>
      {props.error && (
        <div className={styles.error}>
          <IconValidationX className={styles.validationIcon} />
          {props.error}
        </div>
      )}
    </div>
  )
}

const LoadingBody = () => {
  return (
    <div className={styles.container}>
      <LoadingSpinner className={styles.loadingContainer} />
    </div>
  )
}

type SuccessBodyProps = {
  userId: ID
  handle: string
  name: string
  goToRoute: (route: string) => void
}

const SuccessBody = ({ handle, userId, name, goToRoute }: SuccessBodyProps) => {
  const profilePicture = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_150_BY_150
  })

  const onClick = useCallback(() => {
    goToRoute(profilePage(handle))
  }, [goToRoute, handle])

  return (
    <div className={styles.container}>
      <i
        className={cn(
          'emoji face-with-party-horn-and-party-hat',
          styles.verifiedIcon
        )}
      />
      <div className={styles.verified}>{messages.verified}</div>
      <DynamicImage
        image={profilePicture}
        wrapperClassName={styles.profilePicture}
      />
      <div className={styles.displayName}>
        {name}
        <UserBadges
          userId={userId}
          badgeSize={12}
          className={styles.iconVerified}
        />
      </div>
      <div className={styles.handle}>{`@${handle}`}</div>
      <Button variant='secondary' onClick={onClick} iconRight={IconNote}>
        {messages.backToMusic}
      </Button>
    </div>
  )
}

const VerificationPage = () => {
  const dispatch = useDispatch()
  const userId = useSelector(getUserId) ?? 0
  const handle = useSelector(getUserHandle) ?? ''
  const name = useSelector(getUserName) ?? ''
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const record = useRecord()
  const onClick = useCallback(() => setStatus(Status.LOADING), [setStatus])
  const onFailure = useCallback(() => {
    setError(messages.failure)
    setStatus(Status.ERROR)
  }, [setError, setStatus])
  const goToRoute = useCallback(
    (route: string) => dispatch(push(route)),
    [dispatch]
  )

  const instagramLogin = useCallback(
    (uuid: string, profile: InstagramProfile) => {
      if (!profile.is_verified) {
        setError(messages.errorVerifiedInstagram)
        setStatus(Status.ERROR)
      } else if (profile.username.toLowerCase() !== handle.toLowerCase()) {
        setError(messages.errorHandle)
        setStatus(Status.ERROR)
      } else {
        dispatch(instagramLoginAction({ uuid, profile }))
        setStatus(Status.SUCCESS)
      }
      const trackEvent: TrackEvent = make(
        Name.SETTINGS_COMPLETE_INSTAGRAM_OAUTH,
        { is_verified: profile.is_verified, handle, username: profile.username }
      )
      record(trackEvent)
    },
    [handle, dispatch, setError, record]
  )

  const twitterLogin = useCallback(
    (uuid: string, profile: TwitterProfile) => {
      if (!profile.verified) {
        setError(messages.errorVerifiedTwitter)
        setStatus(Status.ERROR)
      } else if (profile.screen_name.toLowerCase() !== handle.toLowerCase()) {
        setError(messages.errorHandle)
        setStatus(Status.ERROR)
      } else {
        dispatch(twitterLoginAction({ uuid, profile }))
        setStatus(Status.SUCCESS)
      }
      const trackEvent: TrackEvent = make(
        Name.SETTINGS_COMPLETE_TWITTER_OAUTH,
        {
          is_verified: profile.verified,
          handle,
          screen_name: profile.screen_name
        }
      )
      record(trackEvent)
    },
    [handle, dispatch, setError, record]
  )

  const tikTokLogin = useCallback(
    (uuid: string, profile: TikTokProfile) => {
      if (!profile.is_verified) {
        setError(messages.errorVerifiedTikTok)
        setStatus(Status.ERROR)
      } else if (profile.username.toLowerCase() !== handle.toLowerCase()) {
        setError(messages.errorHandle)
        setStatus(Status.ERROR)
      } else {
        dispatch(tikTokLoginAction({ uuid, profile }))
        setStatus(Status.SUCCESS)
      }
      const trackEvent: TrackEvent = make(Name.SETTINGS_COMPLETE_TIKTOK_OAUTH, {
        is_verified: profile.is_verified,
        handle,
        username: profile.username
      })
      record(trackEvent)
    },
    [handle, dispatch, setError, record]
  )

  let body
  if (status === Status.LOADING) {
    body = <LoadingBody />
  } else if (status === '' || status === Status.ERROR) {
    body = (
      <VerifyBody
        handle={handle}
        onClick={onClick}
        onFailure={onFailure}
        onInstagramLogin={instagramLogin}
        onTwitterLogin={twitterLogin}
        onTikTokLogin={tikTokLogin}
        error={error}
      />
    )
  } else {
    body = (
      <SuccessBody
        userId={userId}
        handle={handle}
        name={name}
        goToRoute={goToRoute}
      />
    )
  }
  return (
    <Page
      title={messages.title}
      contentClassName={settingsPageStyles.pageContent}
      containerClassName={settingsPageStyles.page}
    >
      <div
        className={cn(settingsPageStyles.bodyContainer, styles.bodyContainer)}
      >
        {body}
      </div>
    </Page>
  )
}

export default VerificationPage
