import React, { useCallback, useState } from 'react'
import cn from 'classnames'

import Page from 'components/general/Page'

import settingsPageStyles from './SettingsPage.module.css'
import { SettingsPageProps } from './SettingsPage'
import InstagramAccountVerification from '../InstagramAccountVerified'
import TwitterAccountVerification from '../TwitterAccountVerified'

import styles from './VerificationPage.module.css'
import { InstagramProfile, TwitterProfile } from 'store/account/reducer'
import { Status } from 'store/types'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconNote,
  IconValidationX
} from '@audius/stems'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useUserProfilePicture } from 'hooks/useImageSize'
import { ProfilePictureSizes, SquareSizes } from 'models/common/ImageSizes'
import { profilePage } from 'utils/route'
import { ID } from 'models/common/Identifiers'
import { BooleanKeys } from 'services/remote-config'
import { useRemoteVar } from 'containers/remote-config/hooks'
import UserBadges from 'containers/user-badges/UserBadges'

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
  twitterButton: 'Verify With Twitter',
  instagramButton: 'Verify With Instagram',
  failure: 'Sorry, unable to retrieve information',
  errorHandle: 'Sorry, your handle does not match',
  errorVerifiedTwitter: 'Your Twitter account isn’t verified',
  errorVerifiedInstagram: 'Your Instagram account isn’t verified',
  backToMusic: 'Back To The Music',
  verified: "YOU'RE VERIFIED!"
}

type VerifyBodyProps = {
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

  return (
    <div className={styles.container}>
      <div>{messages.instructions}</div>
      <div className={styles.warning}>{messages.warning}</div>
      <div className={styles.btnContainer}>
        <TwitterAccountVerification
          onClick={props.onClick}
          onSuccess={props.onTwitterLogin}
          onFailure={props.onFailure}
          className={styles.twitterBtn}
        />
        {displayInstagram && (
          <InstagramAccountVerification
            onClick={props.onClick}
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
    },
    [handle, onInstagramLogin, setError]
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
    },
    [handle, onTwitterLogin, setError]
  )
  let body
  if (status === Status.LOADING) {
    body = <LoadingBody />
  } else if (status === '' || status === Status.ERROR) {
    body = (
      <VerifyBody
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
