import { Suspense, useEffect } from 'react'

import {
  ID,
  Status,
  User,
  accountSelectors,
  AccountImage,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile
} from '@audius/common'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated } from 'react-spring'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Transition } from 'react-spring/renderprops'

import imageSignUp1 from 'assets/img/2-DJ-4-3.jpg'
import imageSignUp2 from 'assets/img/3-Collection-4-3.jpg'
import imageSignUp3 from 'assets/img/4-Conductor-4-3.jpg'
import IconRemove from 'assets/img/iconRemove.svg'
import imagePhone from 'assets/img/imagePhone.png'
import CTAImage from 'assets/img/signUpCTA.png'
import { getStatus } from 'common/store/pages/signon/selectors'
import { Pages, FollowArtistsCategory } from 'common/store/pages/signon/types'
import BackgroundWaves from 'components/background-animations/BackgroundWaves'
import Page from 'components/page/Page'
import SignOnModal from 'components/sign-on/SignOnModal'
import Toast from 'components/toast/Toast'
import { ComponentPlacement, MountPlacement } from 'components/types'
import LoadingPage from 'pages/sign-on/components/LoadingPage'
import ProfilePage from 'pages/sign-on/components/ProfilePage'
import { EmailPage } from 'pages/sign-on/components/desktop/EmailPage'
import FollowPage from 'pages/sign-on/components/desktop/FollowPage'
import PasswordPage from 'pages/sign-on/components/desktop/PasswordPage'
import { SignInPage } from 'pages/sign-on/components/desktop/SignInPage'
import StartPlatformPage from 'pages/sign-on/components/desktop/StartPlatformPage'
import lazyWithPreload from 'utils/lazyWithPreload'
import { useSelector } from 'utils/reducer'
import { BASE_URL, SIGN_UP_PAGE } from 'utils/route'

import AppCTA from './AppCTA'
import styles from './SignOn.module.css'
const getAccountStatus = accountSelectors.getAccountStatus

const MetaMaskModal = lazyWithPreload(
  () => import('pages/sign-on/components/desktop/MetaMaskModal'),
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
  onOtpChange: (otp: string) => void
  onHandleChange: (handle: string) => void
  onNameChange: (name: string) => void
  onSetProfileImage: (img: any) => void
  setTwitterProfile: (
    uuid: string,
    profile: TwitterProfile,
    profileImg?: AccountImage,
    coverBannerImg?: AccountImage,
    skipEdit?: boolean
  ) => void
  setInstagramProfile: (
    uuid: string,
    profile: InstagramProfile,
    profileImg?: AccountImage,
    skipEdit?: boolean
  ) => void
  setTikTokProfile: (
    uuid: string,
    profile: TikTokProfile,
    profileImg?: AccountImage,
    skipEdit?: boolean
  ) => void
  validateHandle: (
    handle: string,
    isOauthVerified: boolean,
    onValidate?: (error: boolean) => void
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
  recordInstagramStart: () => void
  recordTikTokStart: () => void
  suggestedFollows: User[]
  onSelectArtistCategory: (category: FollowArtistsCategory) => void
  onEmailSubmitted: (email: string) => void
}

const pagesAfterFollow = new Set([
  Pages.FOLLOW,
  Pages.LOADING,
  Pages.START,
  Pages.APP_CTA
])

const animatedStyle = {
  base: {
    position: 'absolute' as const,
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

const SignOnPage = ({
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
  onOtpChange,
  onHandleChange,
  onNameChange,
  onSetProfileImage,
  setTwitterProfile,
  setInstagramProfile,
  setTikTokProfile,
  validateHandle,
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
  recordInstagramStart,
  recordTikTokStart,
  onSelectArtistCategory,
  onEmailSubmitted
}: SignOnProps) => {
  const {
    email,
    name,
    password,
    otp,
    handle,
    twitterId,
    verified,
    profileImage,
    status,
    followArtists: { selectedCategory, selectedUserIds }
  } = fields

  const accountStatus = useSelector(getAccountStatus)
  const signOnStatus = useSelector(getStatus)
  useEffect(() => {
    if (
      accountStatus === Status.SUCCESS &&
      signOnStatus === 'success' &&
      page === Pages.LOADING
    ) {
      onNextPage()
    }
  }, [accountStatus, signOnStatus, onNextPage, page])

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
          otp={otp}
          onOtpChange={onOtpChange}
          onSignUp={onViewSignUp}
          onPasswordChange={onPasswordChange}
          onEmailChange={onEmailChange}
          isMobile={false}
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
          onSubmit={onEmailSubmitted}
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
          onNextPage={onNextPage}
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
          handle={handle}
          isVerified={verified}
          name={name}
          onHandleChange={onHandleChange}
          onNameChange={onNameChange}
          onNextPage={onNextPage}
          profileImage={profileImage}
          recordInstagramStart={recordInstagramStart}
          recordTwitterStart={recordTwitterStart}
          recordTikTokStart={recordTikTokStart}
          setInstagramProfile={setInstagramProfile}
          setProfileImage={onSetProfileImage}
          setTikTokProfile={setTikTokProfile}
          setTwitterProfile={setTwitterProfile}
          twitterId={twitterId}
          validateHandle={validateHandle}
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
          onSubmit={(e) => {
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
            {(item) => pages[item]}
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

export default SignOnPage
