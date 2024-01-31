import { useCallback, useEffect, useState } from 'react'

import { Name, Status } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'
import {
  accountActions,
  accountSelectors,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import IconValidationX from 'assets/img/iconValidationX.svg'
import { useModalState } from 'common/hooks/useModalState'
import { make, TrackEvent, useRecord } from 'common/store/analytics/actions'
import { InstagramAuthButton } from 'components/instagram-auth/InstagramAuthButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { TikTokAuthButton } from 'components/tiktok-auth/TikTokAuthButton'
import { TwitterAuthButton } from 'components/twitter-auth/TwitterAuthButton'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'

import styles from './SocialProof.module.css'

const {
  instagramLogin: instagramLoginAction,
  twitterLogin: twitterLoginAction,
  tikTokLogin: tikTokLoginAction
} = accountActions
const getUserHandle = accountSelectors.getUserHandle

const messages = {
  modalTitle: 'Confirm Your Identity',
  description: 'Please confirm your identity before you can continue',
  failure:
    'Sorry, unable to retrieve information or the account is already used',
  errorTwitter: 'Unable to confirm your Twitter account',
  errorInstagram: 'Unable to confirm your Instagram account',
  twitterConfirm: 'Confirm with Twitter',
  instagramConfirm: 'Confirm with Instagram',
  tiktokConfirm: 'Confirm with TikTok'
}

type VerifyBodyProps = {
  handle: string
  onClick: () => void
  onFailure: (kind: 'instagram' | 'twitter' | 'tiktok', error: Error) => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => void
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => void
  onTikTokLogin: (uuid: string, profile: TikTokProfile) => void
  error?: string
}

const VerifyBody = ({
  error,
  handle,
  onClick,
  onTwitterLogin,
  onInstagramLogin,
  onTikTokLogin,
  onFailure
}: VerifyBodyProps) => {
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
  const handleClickTwitter = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_OPEN, {
      handle,
      kind: 'twitter'
    })
    record(trackEvent)
  }, [record, handle, onClick])

  const handleClickInstagram = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_OPEN, {
      handle,
      kind: 'instagram'
    })
    record(trackEvent)
  }, [record, handle, onClick])

  const handleClickTikTok = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_OPEN, {
      handle,
      kind: 'tiktok'
    })
    record(trackEvent)
  }, [record, handle, onClick])

  return (
    <div className={styles.container}>
      <p>{messages.description}</p>
      <div className={styles.btnContainer}>
        {isTwitterEnabled ? (
          <TwitterAuthButton
            onSuccess={onTwitterLogin}
            onFailure={(error: Error) => onFailure('twitter', error)}
            onClick={handleClickTwitter}
            text={messages.twitterConfirm}
          />
        ) : null}
        {isInstagramEnabled && (
          <InstagramAuthButton
            onClick={handleClickInstagram}
            onSuccess={onInstagramLogin}
            onFailure={(error: Error) => onFailure('instagram', error)}
            text={messages.instagramConfirm}
          />
        )}
        {isTikTokEnabled ? (
          <TikTokAuthButton
            onClick={handleClickTikTok}
            onFailure={(error: Error) => onFailure('tiktok', error)}
            onSuccess={onTikTokLogin}
            text={messages.tiktokConfirm}
          />
        ) : null}
      </div>
      {error && (
        <div className={styles.error}>
          <IconValidationX className={styles.validationIcon} />
          {error}
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

type SocialProofProps = {
  onSuccess: () => void
}

/**
 * A modal that verifies social proof of a user.
 * When proof is made, the modal closes. There are no
 * callbacks so that a server may determine proof.
 */
const SocialProof = ({ onSuccess }: SocialProofProps) => {
  const dispatch = useDispatch()
  const onInstagramLogin = useCallback(
    (uuid: string, profile: InstagramProfile) => {
      dispatch(instagramLoginAction({ uuid, profile }))
    },
    [dispatch]
  )
  const onTwitterLogin = useCallback(
    (uuid: string, profile: TwitterProfile) => {
      dispatch(twitterLoginAction({ uuid, profile }))
    },
    [dispatch]
  )
  const onTikTokLogin = useCallback(
    (uuid: string, profile: TikTokProfile) => {
      dispatch(tikTokLoginAction({ uuid, profile }))
    },
    [dispatch]
  )

  const [error, setError] = useState<string | undefined>()
  const [status, setStatus] = useState(Status.IDLE)
  const [isOpen, setIsOpen] = useModalState('SocialProof')
  const handle = useSelector(getUserHandle)

  const onClick = useCallback(() => setStatus(Status.LOADING), [setStatus])
  const record = useRecord()
  const onFailure = useCallback(
    (kind: 'instagram' | 'twitter' | 'tiktok', error: Error) => {
      // We should have an account handle by this point
      if (!handle) return

      setError(messages.failure)
      setStatus(Status.ERROR)

      const trackEvent = make(Name.SOCIAL_PROOF_ERROR, {
        handle,
        kind,
        error: error.message
      })
      record(trackEvent)
    },
    [record, setError, setStatus, handle]
  )

  const handleInstagramLogin = useCallback(
    (uuid: string, profile: InstagramProfile) => {
      // We should have an account handle by this point
      if (!handle) return

      setStatus(Status.SUCCESS)
      onInstagramLogin(uuid, profile)
      setIsOpen(false)

      const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_SUCCESS, {
        handle,
        kind: 'instagram',
        screenName: profile.username
      })
      record(trackEvent)
    },
    [record, handle, onInstagramLogin, setIsOpen]
  )

  const handleTwitterLogin = useCallback(
    (uuid: string, profile: TwitterProfile) => {
      // We should have an account handle by this point
      if (!handle) return

      setStatus(Status.SUCCESS)
      onTwitterLogin(uuid, profile)
      setIsOpen(false)

      const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_SUCCESS, {
        handle,
        kind: 'twitter',
        screenName: profile.screen_name
      })
      record(trackEvent)
    },
    [record, handle, onTwitterLogin, setIsOpen]
  )

  const handleTikTokLogin = useCallback(
    (uuid: string, profile: TikTokProfile) => {
      // We should have an account handle by this point
      if (!handle) return

      setStatus(Status.SUCCESS)
      onTikTokLogin(uuid, profile)
      setIsOpen(false)

      const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_SUCCESS, {
        handle,
        kind: 'tiktok',
        screenName: profile.username
      })
      record(trackEvent)
    },
    [record, handle, onTikTokLogin, setIsOpen]
  )

  useEffect(() => {
    if (status === Status.SUCCESS) {
      onSuccess()
    }
  }, [onSuccess, status])

  let body = null
  if (status === Status.LOADING || handle === null) {
    body = <LoadingBody />
  } else if (status === Status.IDLE || status === Status.ERROR) {
    body = (
      <VerifyBody
        handle={handle}
        onClick={onClick}
        onFailure={onFailure}
        onInstagramLogin={handleInstagramLogin}
        onTwitterLogin={handleTwitterLogin}
        onTikTokLogin={handleTikTokLogin}
        error={error}
      />
    )
  }

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={messages.modalTitle}
      showTitleHeader
      useGradientTitle={false}
      bodyClassName={styles.modalBodyStyle}
    >
      {body}
    </ModalDrawer>
  )
}

export default SocialProof
