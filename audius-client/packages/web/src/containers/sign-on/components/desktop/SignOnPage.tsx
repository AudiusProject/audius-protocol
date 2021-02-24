import React, { Suspense, useEffect } from 'react'
import cn from 'classnames'
import { animated } from 'react-spring'
import { Transition } from 'react-spring/renderprops'
import Toast from 'components/toast/Toast'
import { ComponentPlacement, MountPlacement } from 'components/types'

import Page from 'components/general/Page'
import SignOnModal from 'components/sign-on/SignOnModal'
import BackgroundWaves from 'components/background-animations/BackgroundWaves'

import SignInPage from 'containers/sign-on/components/desktop/SignInPage'
import EmailPage from 'containers/sign-on/components/desktop/EmailPage'
import PasswordPage from 'containers/sign-on/components/desktop/PasswordPage'
import ProfilePage from 'containers/sign-on/components/desktop/ProfilePage'
import FollowPage from 'containers/sign-on/components/desktop/FollowPage'
import LoadingPage from 'containers/sign-on/components/LoadingPage'
import StartPlatformPage from 'containers/sign-on/components/desktop/StartPlatformPage'
import styles from './SignOn.module.css'

import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import imageSignUp1 from 'assets/img/2-DJ-4-3.jpg'
import imageSignUp2 from 'assets/img/3-Collection-4-3.jpg'
import imageSignUp3 from 'assets/img/4-Conductor-4-3.jpg'
import imagePhone from 'assets/img/imagePhone.png'
import CTAImage from 'assets/img/signUpCTA.png'
import { Pages, FollowArtistsCategory } from 'containers/sign-on/store/types'
import User from 'models/User'
import { ID } from 'models/common/Identifiers'
import { BASE_URL, SIGN_UP_PAGE } from 'utils/route'
import AppCTA from './AppCTA'
import lazyWithPreload from 'utils/lazyWithPreload'
import { InstagramProfile } from 'store/account/reducer'

const MetaMaskModal = lazyWithPreload(
  () => import('containers/sign-on/components/desktop/MetaMaskModal'),
  0
)

export type ValidDesktopPages =
  | Pages.SIGNIN
  | Pages.EMAIL
  | Pages.PASSWORD
  | Pages.PROFILE
  | Pages.FOLLOW
  | Pages.LOADING
  | Pages.START
  | Pages.APP_CTA

export type SignOnProps = {
  title: string
  description: string
  page: ValidDesktopPages
  initialPage: boolean
  showMetaMaskOption: boolean
  metaMaskModalOpen: boolean
  hasOpened: boolean
  fields: any
  toastText: string
  onSignIn: (email: string, password: string) => void
  onMetaMaskSignIn: () => void
  onViewSignUp: () => void
  onViewSignIn: () => void
  onEmailChange: (email: string, validate?: boolean) => void
  onPasswordChange: (password: string) => void
  handleOnContinue: (page: Pages) => () => void
  onHandleChange: (handle: string) => void
  onNameChange: (name: string) => void
  onSetProfileImage: (img: any) => void
  setTwitterProfile: (
    twitterId: string,
    profile: { screen_name?: string },
    profileImage: any,
    coverPhoto: any
  ) => void
  setInstagramProfile: (
    instagramId: string,
    profile: InstagramProfile,
    profileImage?: any
  ) => void
  onAddFollows: (followIds: ID[]) => void
  onRemoveFollows: (followIds: ID[]) => void
  onAutoSelect: () => void
  onNextPage: () => void
  onUploadTrack: () => void
  onStartListening: () => void
  closeModal: () => void
  onClickReadMetaMaskConfig: () => void
  onToggleMetaMaskModal: () => void
  onConfigureWithMetaMask: () => void
  recordTwitterStart: () => void
  suggestedFollows: User[]
  onSelectArtistCategory: (category: FollowArtistsCategory) => void
}

const pagesAfterFollow = new Set([
  Pages.FOLLOW,
  Pages.LOADING,
  Pages.START,
  Pages.APP_CTA
])

const animatedStyle = {
  base: {
    position: 'absolute' as 'absolute',
    top: 0,
    left: 0
  },
  full: {
    width: '100%',
    height: '100%'
  },
  pane: {
    width: 400,
    height: 656
  }
}

/**
 * TODO: When the user selects the metamask option, set the localStorage key 'useMetaMask' to true
 * Reference the setup function in Audius backend. A new instance of Audiusbackend will have to be created
 */
const SignOnProvider = ({
  title,
  description,
  page,
  metaMaskModalOpen,
  hasOpened,
  fields,
  toastText,
  onSignIn,
  showMetaMaskOption,
  onMetaMaskSignIn,
  onViewSignUp,
  onViewSignIn,
  onEmailChange,
  onPasswordChange,
  handleOnContinue,
  onHandleChange,
  onNameChange,
  onSetProfileImage,
  setTwitterProfile,
  setInstagramProfile,
  onAddFollows,
  onRemoveFollows,
  onAutoSelect,
  onNextPage,
  onUploadTrack,
  onStartListening,
  closeModal,
  onClickReadMetaMaskConfig,
  onToggleMetaMaskModal,
  onConfigureWithMetaMask,
  suggestedFollows: suggestedFollowEntries,
  recordTwitterStart,
  onSelectArtistCategory
}: SignOnProps) => {
  const {
    email,
    name,
    password,
    handle,
    twitterId,
    verified,
    profileImage,
    status,
    accountReady,
    followArtists: { selectedCategory, selectedUserIds }
  } = fields
  useEffect(() => {
    if (accountReady && page === Pages.LOADING) {
      onNextPage()
    }
  }, [accountReady, onNextPage, page])

  let backgroundImage = null
  let backgroundOverlayGradient = null
  let callToActionImage = null
  let callToActionStyles = null
  let containerStyles = null
  let contentStyles = null
  let imageContainerStyle = null
  let transitionConfig = null
  const pages = {
    [Pages.SIGNIN]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.pane
        }}
      >
        <SignInPage
          hasMetaMask={!!showMetaMaskOption}
          loading={status === 'loading'}
          onSignIn={onSignIn}
          onMetaMaskSignIn={onMetaMaskSignIn}
          email={email}
          password={password}
          onSignUp={onViewSignUp}
          onPasswordChange={onPasswordChange}
          onEmailChange={onEmailChange}
        />
      </animated.div>
    ),
    [Pages.EMAIL]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.pane
        }}
      >
        <EmailPage
          hasMetaMask={!!showMetaMaskOption}
          email={email}
          onSignIn={onViewSignIn}
          onToggleMetaMaskModal={onToggleMetaMaskModal}
          onEmailChange={onEmailChange}
          onNextPage={handleOnContinue(Pages.PASSWORD)}
        />
      </animated.div>
    ),
    [Pages.PASSWORD]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.pane
        }}
      >
        <PasswordPage
          email={email}
          onPasswordChange={onPasswordChange}
          onNextPage={handleOnContinue(Pages.PROFILE)}
        />
      </animated.div>
    ),
    [Pages.PROFILE]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.pane
        }}
      >
        <ProfilePage
          name={name}
          handle={handle}
          isVerified={verified}
          twitterId={twitterId}
          onHandleChange={onHandleChange}
          onNameChange={onNameChange}
          profileImage={profileImage}
          setProfileImage={onSetProfileImage}
          setTwitterProfile={setTwitterProfile}
          setInstagramProfile={setInstagramProfile}
          recordTwitterStart={recordTwitterStart}
          onNextPage={onNextPage}
        />
      </animated.div>
    ),
    [Pages.FOLLOW]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.full
        }}
      >
        <FollowPage
          users={suggestedFollowEntries}
          followedArtists={selectedUserIds}
          onAddFollows={onAddFollows}
          onRemoveFollows={onRemoveFollows}
          onNextPage={onNextPage}
          onAutoSelect={onAutoSelect}
          selectedCategory={selectedCategory}
          onSelectArtistCategory={onSelectArtistCategory}
        />
      </animated.div>
    ),
    [Pages.LOADING]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.full
        }}
      >
        <LoadingPage />
      </animated.div>
    ),
    [Pages.START]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.full
        }}
      >
        <StartPlatformPage
          onUploadTrack={onUploadTrack}
          onStartListening={onStartListening}
        />
      </animated.div>
    ),
    [Pages.APP_CTA]: (style: object) => (
      <animated.div
        style={{
          ...style,
          ...animatedStyle.base,
          ...animatedStyle.pane
        }}
      >
        <AppCTA onNextPage={onNextPage} />
      </animated.div>
    )
  }

  switch (page) {
    case Pages.PASSWORD:
      backgroundImage = imageSignUp2
      callToActionStyles = null
      break
    case Pages.PROFILE:
      backgroundImage = imageSignUp3
      imageContainerStyle = styles.profileImage
      transitionConfig = { duration: 100 }
      callToActionStyles = null
      break
    case Pages.FOLLOW:
      backgroundImage = null
      containerStyles = styles.followContainer
      contentStyles = styles.followContent
      imageContainerStyle = styles.profileImage
      callToActionStyles = null
      break
    case Pages.START:
      containerStyles = styles.startContainer
      contentStyles = styles.startContent
      backgroundImage = null
      callToActionStyles = null
      break
    case Pages.LOADING:
      backgroundImage = null
      containerStyles = styles.loadingContainer
      contentStyles = styles.loadingContent
      callToActionStyles = null
      break
    case Pages.SIGNIN:
    case Pages.EMAIL:
      backgroundImage = imageSignUp1
      backgroundOverlayGradient =
        'radial-gradient(circle, rgba(91,35,225,0.8) 0%, rgba(113,41,230,0.64) 67.96%, rgba(162,47,235,0.5) 100%)'
      callToActionImage = CTAImage
      callToActionStyles = null
      break
    case Pages.APP_CTA:
      backgroundImage = imageSignUp3
      backgroundOverlayGradient =
        'linear-gradient(rgba(126, 27, 204, 0.8), rgba(126, 27, 204, 0.8))'
      callToActionImage = imagePhone
      callToActionStyles = styles.appCTA
      break
    default:
      backgroundImage = null
  }

  const isPageBeforeFollow = !pagesAfterFollow.has(page)

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${SIGN_UP_PAGE}`}
      containerClassName={styles.pageContainer}
      contentClassName={styles.pageContent}
      fadeDuration={400}
    >
      <BackgroundWaves key={'bg-waves'} className={cn(styles.bgWaves)} />
      {isPageBeforeFollow ? (
        <IconRemove className={styles.closeIcon} onClick={closeModal} />
      ) : null}
      <SignOnModal
        backgroundImage={backgroundImage}
        callToActionImage={callToActionImage}
        callToActionStyles={callToActionStyles}
        backgroundOverlayGradient={backgroundOverlayGradient}
        containerStyles={containerStyles}
        contentStyles={contentStyles}
        imageStyles={imageContainerStyle}
        transitionConfig={transitionConfig}
        animateImageIn={
          page !== Pages.SIGNIN && page !== Pages.EMAIL && hasOpened
        }
        hideImageTransition={page === Pages.LOADING || page === Pages.START}
      >
        <form
          method='post'
          onSubmit={e => {
            e.preventDefault()
          }}
          autoComplete='off'
        >
          <Transition
            items={page}
            unique
            from={{
              opacity: !hasOpened ? 1 : 0,
              transform:
                (page === Pages.PASSWORD || page === Pages.PROFILE) && hasOpened
                  ? 'translate3d(100%,0,0)'
                  : 'translate3d(0,0,0)'
            }}
            enter={{
              opacity: 1,
              transform:
                isPageBeforeFollow && hasOpened
                  ? 'translate3d(0%,0,0)'
                  : 'translate3d(0,0,0)'
            }}
            leave={{
              opacity: 0,
              transform:
                page !== Pages.PROFILE && isPageBeforeFollow
                  ? 'translate3d(-50%,0,0)'
                  : 'translate3d(0,0,0)'
            }}
            config={
              page <= Pages.EMAIL
                ? { duration: 75 }
                : isPageBeforeFollow
                ? {}
                : { duration: 220 }
            }
          >
            {item => pages[item]}
          </Transition>
        </form>
      </SignOnModal>
      {showMetaMaskOption ? (
        <Suspense fallback={null}>
          <MetaMaskModal
            open={metaMaskModalOpen}
            onClickReadConfig={onClickReadMetaMaskConfig}
            onClickBack={onToggleMetaMaskModal}
            onClickContinue={onConfigureWithMetaMask}
          />
        </Suspense>
      ) : null}
      <Toast
        useCaret={false}
        mount={MountPlacement.BODY}
        placement={ComponentPlacement.BOTTOM}
        overlayClassName={styles.accountToastOverlay}
        open={!!toastText}
        text={toastText}
      />
    </Page>
  )
}

export default SignOnProvider
