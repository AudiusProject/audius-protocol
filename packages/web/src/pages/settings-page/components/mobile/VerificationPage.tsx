import { useCallback, useState } from 'react'

import {
  ID,
  Name,
  ProfilePictureSizes,
  SquareSizes,
  Status,
  BooleanKeys
} from '@audius/common'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconNote,
  IconValidationX
} from '@audius/stems'
import cn from 'classnames'

import { InstagramProfile, TwitterProfile } from 'common/store/account/reducer'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import UserBadges from 'components/user-badges/UserBadges'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { useRecord, make, TrackEvent } from 'store/analytics/actions'
import { profilePage } from 'utils/route'

import InstagramAccountVerification from '../InstagramAccountVerified'
import TwitterAccountVerification from '../TwitterAccountVerified'

import { SettingsPageProps } from './SettingsPage'
import settingsPageStyles from './SettingsPage.module.css'
import styles from './VerificationPage.module.css'

const messages = {
  title: 'VERIFICATION',
  instructions:
    'Getting verified on Audius is easy! Just link your verified Twitter or Instagram account and you’ll be verified immediately.',
  warning: (
    <span>
      {'Your Audius handle must '}
      <b>exactly</b> {' match the verified handle you’re connecting.'}
    </span>
  ),
  failure: 'Sorry, unable to retrieve information',
  errorHandle: 'Sorry, your handle does not match',
  errorVerifiedTwitter: 'Your Twitter account isn’t verified',
  errorVerifiedInstagram: 'Your Instagram account isn’t verified',
  backToMusic: 'Back To The Music',
  verified: "YOU'RE VERIFIED!"
}

type VerifyBodyProps = {
  handle: string
  onClick: () => void
  onFailure: () => void
  onTwitterLogin: (uuid: string, profile: any) => void
  onInstagramLogin: (uuid: string, profile: any) => void
  error?: string
}

const VerifyBody = (props: VerifyBodyProps) => {
  const displayInstagram = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION
  )

  const record = useRecord()
  const { handle, onClick } = props
  const onTwitterClick = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_TWITTER_OAUTH, {
      handle
    })
    record(trackEvent)
  }, [record, onClick, handle])

  const onInstagramClick = useCallback(() => {
    onClick()
    const trackEvent: TrackEvent = make(Name.SETTINGS_START_INSTAGRAM_OAUTH, {
      handle
    })
    record(trackEvent)
  }, [record, onClick, handle])

  return (
    <div className={styles.container}>
      <div>{messages.instructions}</div>
      <div className={styles.warning}>{messages.warning}</div>
      <div className={styles.btnContainer}>
        <TwitterAccountVerification
          onClick={onTwitterClick}
          onSuccess={props.onTwitterLogin}
          onFailure={props.onFailure}
          className={styles.twitterBtn}
        />
        {displayInstagram && (
          <InstagramAccountVerification
            onClick={onInstagramClick}
            onSuccess={props.onInstagramLogin}
            onFailure={props.onFailure}
          />
        )}
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
  profilePictureSizes: ProfilePictureSizes | null
  goToRoute: (route: string) => void
}

const SuccessBody = ({
  handle,
  userId,
  name,
  profilePictureSizes,
  goToRoute
}: SuccessBodyProps) => {
  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

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
      <Button
        type={ButtonType.COMMON_ALT}
        className={styles.successBtn}
        textClassName={styles.btnText}
        size={ButtonSize.MEDIUM}
        text={messages.backToMusic}
        onClick={onClick}
        rightIcon={<IconNote className={styles.noteIcon} />}
      />
    </div>
  )
}

const VerificationPage = ({
  handle,
  userId,
  name,
  profilePictureSizes,
  goToRoute,
  onTwitterLogin,
  onInstagramLogin
}: SettingsPageProps) => {
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const record = useRecord()
  const onClick = useCallback(() => setStatus(Status.LOADING), [setStatus])
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
        onInstagramLogin(uuid, profile)
        setStatus(Status.SUCCESS)
      }
      const trackEvent: TrackEvent = make(
        Name.SETTINGS_COMPLETE_INSTAGRAM_OAUTH,
        { is_verified: profile.is_verified, handle, username: profile.username }
      )
      record(trackEvent)
    },
    [handle, onInstagramLogin, setError, record]
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
    [handle, onTwitterLogin, setError, record]
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
        error={error}
      />
    )
  } else {
    body = (
      <SuccessBody
        userId={userId}
        handle={handle}
        name={name}
        profilePictureSizes={profilePictureSizes}
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
