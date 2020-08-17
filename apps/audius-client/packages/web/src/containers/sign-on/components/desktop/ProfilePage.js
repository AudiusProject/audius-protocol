/* globals fetch, File */
import React, { Component } from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './ProfilePage.module.css'
import BackButton from 'components/general/BackButton'
import { resizeImage } from 'utils/imageProcessingUtil'
import DesktopTwitterOverlay from 'containers/sign-on/components/desktop/TwitterOverlay'
import MobileTwitterOverlay from 'containers/sign-on/components/mobile/TwitterOverlay'
import ProfileForm from 'containers/sign-on/components/ProfileForm'

const messages = {
  header: 'Tell Us About Yourself So Others Can Find You'
}

export class ProfilePage extends Component {
  state = {
    // If the handle field is disabled, don't let the user twitter auth
    showTwitterOverlay: this.props.handle.status !== 'disabled',
    handleError: '',
    profileValid: false,
    initial: true,
    isSubmitted: false
  }

  onToggleTwitterOverlay = () =>
    this.setState({
      showTwitterOverlay: !this.state.showTwitterOverlay,
      initial: false
    })

  onContinue = () => {
    if (this.getProfileValid() && !this.state.isSubmitted) {
      this.props.onNextPage()
      this.setState({ isSubmitted: true })
    }
  }

  getProfileValid = () => {
    const { name, handle } = this.props
    return (
      name.value &&
      (handle.status === 'success' || handle.status === 'disabled')
    )
  }

  onTwitterLogin = async twitterProfile => {
    try {
      const { uuid, profile } = await twitterProfile.json()
      const profileUrl = profile.profile_image_url_https.replace(
        /_(normal|bigger|mini)/g,
        ''
      )
      const imageBlob = await fetch(profileUrl).then(r => r.blob())
      const artworkFile = new File([imageBlob], 'Artwork', {
        type: 'image/jpeg'
      })
      const file = await resizeImage(artworkFile)
      const url = URL.createObjectURL(file)

      if (profile.profile_banner_url) {
        const bannerImageBlob = await fetch(
          profile.profile_banner_url
        ).then(r => r.blob())
        const bannerArtworkFile = new File([bannerImageBlob], 'Artwork', {
          type: 'image/webp'
        })
        const bannerFile = await resizeImage(
          bannerArtworkFile,
          2000,
          /* square= */ false
        )
        const bannerUrl = URL.createObjectURL(bannerFile)
        this.props.setTwitterProfile(
          uuid,
          profile,
          { url, file },
          { url: bannerUrl, file: bannerFile }
        )
      } else {
        this.props.setTwitterProfile(uuid, profile, { url, file })
      }
      this.setState({ showTwitterOverlay: false, initial: false })
    } catch (err) {
      this.setState({ showTwitterOverlay: false, initial: false })
    }
  }

  onHandleKeyDown = e => {
    if (e.keyCode === 13 /** enter */) {
      this.onContinue()
    }
  }

  render() {
    const {
      name,
      handle,
      profileImage,
      isVerified,
      setProfileImage,
      twitterId,
      isMobile,
      recordTwitterStart
    } = this.props
    const { showTwitterOverlay, initial } = this.state
    const canUpdateHandle = !(
      isVerified &&
      twitterId &&
      handle.status === 'success'
    )
    const profileValid = this.getProfileValid()
    const TwitterOverlay = isMobile
      ? MobileTwitterOverlay
      : DesktopTwitterOverlay
    return (
      <div
        className={cn(styles.container, {
          [styles.isMobile]: isMobile
        })}
      >
        {isMobile ? null : (
          <>
            <div className={styles.header}>{messages.header}</div>
            <BackButton
              light
              onClickBack={this.onToggleTwitterOverlay}
              className={cn(styles.backButton, {
                [styles.hide]: showTwitterOverlay
              })}
            />
          </>
        )}
        <div className={styles.profileContentContainer}>
          <TwitterOverlay
            header={messages.header}
            isMobile={isMobile}
            initial={initial}
            showTwitterOverlay={showTwitterOverlay}
            onClick={recordTwitterStart}
            onTwitterLogin={this.onTwitterLogin}
            onToggleTwitterOverlay={this.onToggleTwitterOverlay}
          />
          <ProfileForm
            isMobile={isMobile}
            header={messages.header}
            showTwitterOverlay={showTwitterOverlay}
            profileImage={profileImage}
            name={name}
            onTwitterLogin={this.onTwitterLogin}
            onToggleTwitterOverlay={this.onToggleTwitterOverlay}
            canUpdateHandle={canUpdateHandle}
            handle={handle}
            setProfileImage={setProfileImage}
            profileValid={profileValid}
            onHandleKeyDown={this.onHandleKeyDown}
            onHandleChange={this.props.onHandleChange}
            onNameChange={this.props.onNameChange}
            onContinue={this.onContinue}
          />
        </div>
      </div>
    )
  }
}

ProfilePage.propTypes = {
  setProfileImage: PropTypes.func,
  onNextPage: PropTypes.func,
  onEmailChange: PropTypes.func,
  onTwitterLogin: PropTypes.func,
  inputStatus: PropTypes.oneOf(['default', 'error', 'valid']),
  errorType: PropTypes.oneOf(['invalidEmail', 'inUse']),
  hadleFromTwitter: PropTypes.bool,
  isMobile: PropTypes.bool
}

ProfilePage.defaultProps = {
  inputStatus: 'default',
  hadleFromTwitter: false
}

export default ProfilePage
