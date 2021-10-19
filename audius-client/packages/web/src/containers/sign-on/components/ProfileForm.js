import React, { useEffect, useState } from 'react'

import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Spring } from 'react-spring/renderprops'
import TwitterLogin from 'react-twitter-auth'

import profilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import Input from 'components/data-entry/Input'
import InstagramAuth from 'components/general/InstagramAuth'
import ProfilePicture from 'components/general/ProfilePicture'
import StatusMessage from 'components/general/StatusMessage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useDelayedEffect } from 'hooks/useDelayedEffect'
import { IDENTITY_SERVICE } from 'services/AudiusBackend'
import { resizeImage } from 'utils/imageProcessingUtil'

import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_HANDLE_LENGTH
} from '../utils/formatSocialProfile'

import styles from './ProfileForm.module.css'

const messages = {
  manual: 'I’d rather fill out my profile manually',
  uploadProfilePicture: 'Upload a profile picture',
  errors: {
    tooLong: 'Sorry, handle is too long',
    characters: 'Only use A-Z, 0-9, and underscores',
    inUse: 'That handle has already been taken',
    twitterReserved: 'This verified Twitter handle is reserved.',
    instagramReserved: 'This verified Instagram handle is reserved.'
  },
  completeWithTwitter: 'Link to Twitter to claim',
  completeWithInstagram: 'Link to Instagram to claim'
}

const ProfileForm = props => {
  const [focus, onChangeFocus] = useState(false)
  const { profileValid, name, handle, profileImage, onContinue } = props
  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] = useState(
    false
  )

  useDelayedEffect({
    callback: () => setShouldShowLoadingSpinner(true),
    reset: () => setShouldShowLoadingSpinner(false),
    condition: handle.status === 'loading',
    delay: 1000
  })

  const onDropArtwork = async selectedFiles => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      props.setProfileImage({ file, url })
    } catch (err) {
      props.setProfileImage({ ...profileImage, error: err.message })
    }
  }

  const suggestTwitterLogin = handle.error === 'twitterReserved'
  const suggestInstagramLogin = handle.error === 'instagramReserved'

  return (
    <div
      className={cn(styles.profileFormContainer, {
        [styles.isMobile]: props.isMobile,
        [styles.blur]: props.showTwitterOverlay,
        [styles.moveFormUp]: suggestTwitterLogin || suggestInstagramLogin
      })}
    >
      {props.isMobile ? (
        <div className={styles.header}>{props.header}</div>
      ) : null}
      <div className={styles.profilePic}>
        <ProfilePicture
          showEdit={!profileImage}
          isMobile={props.isMobile}
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
          [styles.hide]: props.showTwitterOverlay,
          [styles.errorInput]: handle.error
        })}
      >
        <Input
          placeholder='Display Name'
          name='name'
          autoComplete='off'
          size='medium'
          variant={props.isMobile ? 'normal' : 'elevatedPlaceholder'}
          value={name.value}
          characterLimit={MAX_DISPLAY_NAME_LENGTH}
          showCharacterLimit={name.value.length === MAX_DISPLAY_NAME_LENGTH}
          warning={name.value.length === MAX_DISPLAY_NAME_LENGTH}
          onChange={props.onNameChange}
          className={cn(styles.profileInput, styles.nameInput, {
            [styles.placeholder]: props.name.value === ''
          })}
        />
        <div className={styles.handleContainer}>
          <Input
            placeholder='Handle'
            size='medium'
            name='nickname'
            autoComplete='off'
            value={handle.value}
            disabled={!props.canUpdateHandle || handle.status === 'disabled'}
            onChange={props.onHandleChange}
            characterLimit={MAX_HANDLE_LENGTH}
            showCharacterLimit={handle.value.length === MAX_HANDLE_LENGTH}
            warning={handle.value.length === MAX_HANDLE_LENGTH}
            onKeyDown={props.onHandleKeyDown}
            variant={props.isMobile ? 'normal' : 'elevatedPlaceholder'}
            onFocus={() => {
              onChangeFocus(true)
            }}
            onBlur={() => {
              onChangeFocus(false)
            }}
            className={cn(styles.profileInput, styles.handleInput, {
              [styles.placeholder]: props.handle.value === ''
            })}
            error={!!handle.error}
          />
          <span
            className={cn(styles.atHandle, {
              [styles.atHandleFocus]: focus || props.handle.value
            })}
          >
            {'@'}
          </span>
        </div>
        {handle.error ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            leave={{ opacity: 0 }}
            config={{ duration: 200 }}
          >
            {animProps => (
              <StatusMessage
                status='error'
                containerStyle={animProps}
                containerClassName={styles.errorMessage}
                label={messages.errors[handle.error]}
              />
            )}
          </Spring>
        ) : null}
        {suggestTwitterLogin ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            leave={{ opacity: 0 }}
            config={{ duration: 200 }}
          >
            {animProps => (
              <div style={animProps} className={styles.suggestTwitter}>
                <TwitterLogin
                  onFailure={(...args) => console.log(args)}
                  onSuccess={props.onTwitterLogin}
                  className={styles.hideTwitterButton}
                  requestTokenUrl={`${IDENTITY_SERVICE}/twitter`}
                  loginUrl={`${IDENTITY_SERVICE}/twitter/callback`}
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
            leave={{ opacity: 0 }}
            config={{ duration: 200 }}
          >
            {animProps => (
              <div style={animProps} className={styles.suggestTwitter}>
                <InstagramAuth
                  onFailure={(...args) => console.log(args)}
                  onSuccess={props.onInstagramLogin}
                  className={styles.hideTwitterButton}
                  setProfileUrl={`${IDENTITY_SERVICE}/instagram/profile`}
                  getUserUrl={`${IDENTITY_SERVICE}/instagram`}
                >
                  {messages.completeWithInstagram}
                </InstagramAuth>
              </div>
            )}
          </Spring>
        ) : null}
      </div>
      <Button
        text='Continue'
        name='continue'
        minWidth={160}
        rightIcon={
          shouldShowLoadingSpinner ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <IconArrow />
          )
        }
        type={profileValid ? ButtonType.PRIMARY_ALT : ButtonType.DISABLED}
        onClick={onContinue}
        textClassName={styles.continueButtonText}
        className={cn(styles.continueButton, {
          [styles.hide]: props.showTwitterOverlay
        })}
      />
    </div>
  )
}

const field = PropTypes.shape({
  value: PropTypes.string,
  error: PropTypes.string,
  status: PropTypes.string
})

ProfileForm.propTypes = {
  header: PropTypes.string,
  isMobile: PropTypes.bool,
  showTwitterOverlay: PropTypes.bool,
  profileImage: PropTypes.any,
  name: field,
  onTwitterLogin: PropTypes.func,
  onToggleTwitterOverlay: PropTypes.func,
  profileValid: PropTypes.bool,
  canUpdateHandle: PropTypes.bool,
  handle: field,
  setProfileImage: PropTypes.func,
  onHandleKeyDown: PropTypes.func,
  onHandleChange: PropTypes.func,
  onNameChange: PropTypes.func,
  onContinue: PropTypes.func
}

ProfileForm.defaultProps = {}

export default ProfileForm
