import { useCallback, useEffect, useState } from 'react'

import { Name, Status, BooleanKeys } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconValidationX } from 'assets/img/iconValidationX.svg'
import { useModalState } from 'common/hooks/useModalState'
import {
  TwitterProfile,
  InstagramProfile,
  instagramLogin as instagramLoginAction,
  twitterLogin as twitterLoginAction
} from 'common/store/account/reducer'
import { getUserHandle } from 'common/store/account/selectors'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import InstagramAccountVerification from 'pages/settings-page/components/InstagramAccountVerified'
import TwitterAccountVerification from 'pages/settings-page/components/TwitterAccountVerified'
import { make, TrackEvent, useRecord } from 'store/analytics/actions'

import styles from './SocialProof.module.css'

const messages = {
  modalTitle: 'Confirm Your Identity',
  description: 'Please confirm your identity before you can continue',
  failure:
    'Sorry, unable to retrieve information or the account is already used',
  errorTwitter: 'Unable to verify your Twitter account',
  errorInstagram: 'Unable to verify your Instagram account'
}

type VerifyBodyProps = {
  handle: string
  onClick: () => void
  onFailure: (kind: 'instagram' | 'twitter', error: Error) => void
  onTwitterLogin: (uuid: string, profile: any) => void
  onInstagramLogin: (uuid: string, profile: any) => void
  error?: string
}

const VerifyBody = ({
  error,
  handle,
  onClick,
  onTwitterLogin,
  onInstagramLogin,
  onFailure
}: VerifyBodyProps) => {
  const displayInstagram = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP
  )
  const record = useRecord()
  const onTwitterClick = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_OPEN, {
      handle,
      kind: 'twitter'
    })
    record(trackEvent)
  }, [record, handle, onClick])

  const onInstagramClick = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_OPEN, {
      handle,
      kind: 'instagram'
    })
    record(trackEvent)
  }, [record, handle, onClick])

  return (
    <div className={styles.container}>
      <p>{messages.description}</p>
      <div className={styles.btnContainer}>
        <TwitterAccountVerification
          onSuccess={onTwitterLogin}
          onFailure={(error: Error) => onFailure('twitter', error)}
          className={styles.twitterClassName}
          onClick={onTwitterClick}
        />
        {displayInstagram && (
          <InstagramAccountVerification
            onClick={onInstagramClick}
            onSuccess={onInstagramLogin}
            onFailure={(error: Error) => onFailure('instagram', error)}
            requiresProfileMetadata={false}
          />
        )}
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

  const [error, setError] = useState<string | undefined>()
  const [status, setStatus] = useState(Status.IDLE)
  const [isOpen, setIsOpen] = useModalState('SocialProof')
  const handle = useSelector(getUserHandle)

  const onClick = useCallback(() => setStatus(Status.LOADING), [setStatus])
  const record = useRecord()
  const onFailure = useCallback(
    (kind: 'instagram' | 'twitter', error: Error) => {
      // We should have an account handle by this point
      if (!handle) return

      setError(messages.failure)
      setStatus(Status.ERROR)

      const trackEvent: TrackEvent = make(Name.SOCIAL_PROOF_ERROR, {
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
        error={error}
      />
    )
  }

  return (
    <ModalDrawer
      bodyClassName={styles.modalBody}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={messages.modalTitle}
      showTitleHeader
      useGradientTitle={false}>
      {body}
    </ModalDrawer>
  )
}

export default SocialProof
