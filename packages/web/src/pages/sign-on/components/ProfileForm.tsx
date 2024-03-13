import { KeyboardEventHandler, useState } from 'react'

import { imageProfilePicEmpty as profilePicEmpty } from '@audius/common/assets'
import {
  MAX_HANDLE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH
} from '@audius/common/services'
import { getErrorMessage } from '@audius/common/utils'
import { Button, IconArrowRight } from '@audius/harmony'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Spring } from 'react-spring/renderprops.cjs'
import TwitterLogin from 'react-twitter-auth'

import Input from 'components/data-entry/Input'
import InstagramAuth, {
  InstagramAuthProps
} from 'components/instagram-auth/InstagramAuth'
import ProfilePicture from 'components/profile-picture/ProfilePicture'
import { StatusMessage } from 'components/status-message/StatusMessage'
import { TwitterAuthProps } from 'components/twitter-auth/TwitterAuth'
import { useDelayedEffect } from 'hooks/useDelayedEffect'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { resizeImage } from 'utils/imageProcessingUtil'

import styles from './ProfileForm.module.css'

const messages = {
  uploadProfilePicture: 'Upload a profile picture',
  errors: {
    tooLong: 'Sorry, handle is too long',
    characters: 'Only use A-Z, 0-9, . and _',
    inUse: 'That handle has already been taken',
    twitterReserved: 'This verified Twitter handle is reserved.',
    instagramReserved: 'This verified Instagram handle is reserved.',
    tikTokReserved: 'This verified TikTok handle is reserved.'
  },
  completeWithTwitter: 'Link to Twitter to claim',
  completeWithInstagram: 'Link to Instagram to claim',
  completeWithTikTok: 'Link to TikTok to claim'
}

type Field = {
  error?: string
  status?: string
  value?: string
}

export type ProfileFormProps = {
  canUpdateHandle: boolean
  handle: Field
  header: string
  isMobile?: boolean
  name: Field
  onContinue: () => void
  onInstagramLogin: InstagramAuthProps['onSuccess']
  onHandleChange: (value: any) => void
  onHandleKeyDown: KeyboardEventHandler
  onNameChange: (name: string) => void
  onToggleTwitterOverlay: () => void
  onTwitterLogin: TwitterAuthProps['onSuccess']
  // TODO: type profileImage
  profileImage: any
  profileValid: boolean
  setProfileImage: (image: any) => void
}

const ProfileForm = (props: ProfileFormProps) => {
  const {
    canUpdateHandle,
    handle,
    header,
    isMobile,
    name,
    onContinue,
    onHandleChange,
    onHandleKeyDown,
    onInstagramLogin,
    onNameChange,
    onTwitterLogin,
    profileImage,
    profileValid,
    setProfileImage
  } = props
  const [focus, onChangeFocus] = useState(false)
  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState(false)

  useDelayedEffect({
    callback: () => setShouldShowLoadingSpinner(true),
    reset: () => setShouldShowLoadingSpinner(false),
    condition: handle.status === 'loading',
    delay: 1000
  })

  const onDropArtwork = async (selectedFiles: File[]) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      setProfileImage({ file, url })
    } catch (err) {
      setProfileImage({ ...profileImage, error: getErrorMessage(err) })
    }
  }

  // TODO: Handle tiktok here
  const suggestTwitterLogin = handle.error === 'twitterReserved'
  const suggestInstagramLogin = handle.error === 'instagramReserved'
  const suggestTikTokLogin = handle.error === 'tikTokReserved'

  return (
    <div
      className={cn(styles.profileFormContainer, {
        [styles.isMobile]: isMobile,
        [styles.moveFormUp]:
          suggestTwitterLogin || suggestInstagramLogin || suggestTikTokLogin
      })}
    >
      {isMobile ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.profilePic}>
        <ProfilePicture
          showEdit={!profileImage}
          isMobile={isMobile}
          includePopup={false}
          updatedProfilePicture={
            profileImage ? profileImage.url : profilePicEmpty
          }
          error={profileImage ? profileImage.error : false}
          hasProfilePicture={!!profileImage}
          onDrop={onDropArtwork}
        />
      </div>
      <div
        className={cn(styles.inputContainer, {
          [styles.errorInput]: handle.error
        })}
      >
        <Input
          placeholder='Display Name'
          name='name'
          id='name-input'
          autoComplete='off'
          size='medium'
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          value={name.value}
          characterLimit={MAX_DISPLAY_NAME_LENGTH}
          showCharacterLimit={name.value?.length === MAX_DISPLAY_NAME_LENGTH}
          warning={name.value?.length === MAX_DISPLAY_NAME_LENGTH}
          onChange={onNameChange}
          className={cn(styles.profileInput, styles.nameInput, {
            [styles.placeholder]: name.value === ''
          })}
        />
        <div className={styles.handleContainer}>
          <Input
            placeholder='Handle'
            size='medium'
            name='nickname'
            id='nickname-input'
            autoComplete='off'
            value={handle.value}
            disabled={!canUpdateHandle || handle.status === 'disabled'}
            onChange={onHandleChange}
            characterLimit={MAX_HANDLE_LENGTH}
            showCharacterLimit={handle.value?.length === MAX_HANDLE_LENGTH}
            warning={handle.value?.length === MAX_HANDLE_LENGTH}
            onKeyDown={onHandleKeyDown}
            variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
            onFocus={() => {
              onChangeFocus(true)
            }}
            onBlur={() => {
              onChangeFocus(false)
            }}
            className={cn(styles.profileInput, styles.handleInput, {
              [styles.placeholder]: handle.value === ''
            })}
            error={!!handle.error}
          />
          <span
            className={cn(styles.atHandle, {
              [styles.atHandleFocus]: focus || handle.value
            })}
          >
            {'@'}
          </span>
        </div>
        {handle.error ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            config={{ duration: 200 }}
          >
            {(animProps) => (
              <StatusMessage
                status='error'
                containerStyle={animProps}
                containerClassName={styles.errorMessage}
                label={
                  messages.errors[handle.error as keyof typeof messages.errors]
                }
              />
            )}
          </Spring>
        ) : null}
        {suggestTwitterLogin ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            config={{ duration: 200 }}
          >
            {(animProps) => (
              <div style={animProps} className={styles.suggestTwitter}>
                <TwitterLogin
                  onFailure={console.error}
                  onSuccess={onTwitterLogin as any}
                  /* @ts-ignore */
                  className={styles.hideTwitterButton}
                  requestTokenUrl={`${audiusBackendInstance.identityServiceUrl}/twitter`}
                  loginUrl={`${audiusBackendInstance.identityServiceUrl}/twitter/callback`}
                >
                  {messages.completeWithTwitter}
                </TwitterLogin>
              </div>
            )}
          </Spring>
        ) : null}
        {suggestInstagramLogin ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            config={{ duration: 200 }}
          >
            {(animProps) => (
              <div style={animProps} className={styles.suggestTwitter}>
                <InstagramAuth
                  onFailure={console.error}
                  onSuccess={onInstagramLogin}
                  className={styles.hideTwitterButton}
                >
                  {messages.completeWithInstagram}
                </InstagramAuth>
              </div>
            )}
          </Spring>
        ) : null}
        {suggestTikTokLogin ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            config={{ duration: 200 }}
          >
            {(animProps) => (
              <div style={animProps} className={styles.suggestTwitter}>
                {/* TODO: Implement tiktok auth */}
              </div>
            )}
          </Spring>
        ) : null}
      </div>
      <Button
        variant='primary'
        name='continue'
        isLoading={shouldShowLoadingSpinner}
        iconRight={IconArrowRight}
        disabled={!profileValid}
        onClick={onContinue}
      >
        Continue
      </Button>
    </div>
  )
}

export default ProfileForm
