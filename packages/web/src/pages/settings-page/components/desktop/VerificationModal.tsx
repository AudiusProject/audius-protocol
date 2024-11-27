import { useCallback, useState } from 'react'

import {
  Name,
  SquareSizes,
  Status,
  ID,
  ProfilePictureSizes
} from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'
import {
  musicConfettiActions,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Modal, IconValidationX, IconNote, Button, Flex } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useRecord, make, TrackEvent } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { InstagramAuthButton } from 'components/instagram-auth/InstagramAuthButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { TikTokAuthButton } from 'components/tiktok-auth/TikTokAuthButton'
import { TwitterAuthButton } from 'components/twitter-auth/TwitterAuthButton'
import UserBadges from 'components/user-badges/UserBadges'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './VerificationModal.module.css'

const { profilePage } = route
const { show: showMusicConfetti } = musicConfettiActions

const messages = {
  title: 'Verification',
  buttonText: 'Get Verified!',
  description:
    'Getting verified on Audius is easy! Just link your verified Instagram, TikTok or legacy verified Twitter account and you’ll be verified immediately.',
  warning: (
    <p>
      Your Audius handle must <b>exactly</b> match the verified handle you’re
      connecting.
    </p>
  ),
  verifiedBtn: "You're Verified!",
  verified: "YOU'RE VERIFIED",
  backToMusic: 'Back To The Music',
  failure: 'Sorry, unable to retrieve information',
  errorHandle: 'Sorry, your handle does not match',
  errorVerifiedTwitter: "Your Twitter account isn't legacy verified",
  errorVerifiedInstagram: "Your Instagram account isn't verified",
  errorVerifiedTikTok: "Your TikTok account isn't verified",
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
      <p className={styles.text}>{messages.description}</p>
      <div className={cn(styles.text, styles.warning)}>{messages.warning}</div>
      <Flex direction='column' w='100%' mt='xl' gap='s'>
        {isTwitterEnabled ? (
          <TwitterAuthButton
            onClick={handleClickTwitter}
            onFailure={props.onFailure}
            onSuccess={props.onTwitterLogin}
            fullWidth
          >
            {messages.twitterVerify}
          </TwitterAuthButton>
        ) : null}

        {isInstagramEnabled ? (
          <InstagramAuthButton
            onClick={handleClickInstagram}
            onFailure={props.onFailure}
            onSuccess={props.onInstagramLogin}
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
      </Flex>
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
      <div className={styles.verified}>
        {messages.verified}
        <i
          className={cn(
            'emoji face-with-party-horn-and-party-hat',
            styles.verifiedIcon
          )}
        />
      </div>
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
      <Button variant='primary' onClick={onClick} iconRight={IconNote}>
        {messages.backToMusic}
      </Button>
    </div>
  )
}

type VerificationModalProps = {
  userId: ID
  handle: string
  name: string
  profilePictureSizes: ProfilePictureSizes | null
  isVerified?: boolean
  goToRoute: (route: string) => void
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => void
  onTikTokLogin: (uuid: string, profile: TikTokProfile) => void
}

// A modal that allows you to toggle a track to unlisted, as
// well as toggle individual metadata field visibility.
const VerificationModal = (props: VerificationModalProps) => {
  const { handle, onInstagramLogin, onTwitterLogin, onTikTokLogin } = props
  const dispatch = useDispatch()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const onClick = useCallback(() => setStatus(Status.LOADING), [setStatus])
  const record = useRecord()
  const onFailure = useCallback(() => {
    setError(messages.failure)
    setStatus(Status.ERROR)
  }, [setError, setStatus])

  const instagramLogin = useCallback(
    (uuid: string, profile: InstagramProfile) => {
      if (!profile.is_verified) {
        setError(messages.errorVerifiedInstagram)
        setStatus(Status.ERROR)
      } else if (profile.username.toLowerCase() !== handle.toLowerCase()) {
        setError(messages.errorHandle)
        setStatus(Status.ERROR)
      } else {
        dispatch(showMusicConfetti())
        onInstagramLogin(uuid, profile)
        setStatus(Status.SUCCESS)
      }
      const trackEvent: TrackEvent = make(
        Name.SETTINGS_COMPLETE_INSTAGRAM_OAUTH,
        { is_verified: profile.is_verified, handle, username: profile.username }
      )
      record(trackEvent)
    },
    [dispatch, handle, onInstagramLogin, setError, record]
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
        dispatch(showMusicConfetti())
        onTwitterLogin(uuid, profile)
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
    [dispatch, handle, onTwitterLogin, setError, record]
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
        dispatch(showMusicConfetti())
        onTikTokLogin(uuid, profile)
        setStatus(Status.SUCCESS)
      }
      const trackEvent: TrackEvent = make(Name.SETTINGS_COMPLETE_TIKTOK_OAUTH, {
        is_verified: profile.is_verified,
        handle,
        username: profile.username
      })
      record(trackEvent)
    },
    [dispatch, handle, onTikTokLogin, setError, record]
  )

  const onOpen = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => {
    setIsOpen(false)
    setError('')
  }, [setIsOpen, setError])

  let body
  if (status === Status.LOADING) {
    body = <LoadingBody />
  } else if (status === '' || status === Status.ERROR) {
    body = (
      <VerifyBody
        handle={props.handle}
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
        userId={props.userId}
        handle={props.handle}
        name={props.name}
        goToRoute={props.goToRoute}
      />
    )
  }
  const canDismiss = status !== Status.LOADING
  return (
    <>
      {props.isVerified ? (
        <Button variant='secondary' disabled fullWidth>
          {messages.verifiedBtn}
        </Button>
      ) : (
        <Button variant='secondary' fullWidth onClick={onOpen}>
          {messages.buttonText}
        </Button>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        showDismissButton={canDismiss}
        dismissOnClickOutside={canDismiss}
        showTitleHeader
        title={messages.title}
        wrapperClassName={styles.wrapperClassName}
        bodyClassName={styles.modalBodyStyle}
        headerContainerClassName={styles.headerContainer}
      >
        {body}
      </Modal>
    </>
  )
}

export default VerificationModal
