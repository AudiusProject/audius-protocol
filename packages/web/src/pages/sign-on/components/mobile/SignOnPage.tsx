import { useEffect } from 'react'

import {
  Image,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile
} from '@audius/common'
import { ID, User } from '@audius/common/models'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated } from 'react-spring'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Transition } from 'react-spring/renderprops.cjs'

import { Pages, FollowArtistsCategory } from 'common/store/pages/signon/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import ProfilePage from 'pages/sign-on/components/ProfilePage'
import FollowPage, {
  BottomSection as FollowPageBottom
} from 'pages/sign-on/components/mobile/FollowPage'
import Header from 'pages/sign-on/components/mobile/Header'
import InitialPage from 'pages/sign-on/components/mobile/InitialPage'
import NotificationPermissionsPage from 'pages/sign-on/components/mobile/NotificationPermissionsPage'
import PasswordPage from 'pages/sign-on/components/mobile/PasswordPage'
import { BASE_URL, SIGN_UP_PAGE } from 'utils/route'

import LoadingPage from './LoadingPage'
import styles from './SignOnPage.module.css'

export type SignOnProps = {
  title: string
  description: string
  page: MobilePages
  signIn: boolean
  hasAccount: boolean
  initialPage: boolean
  showMetaMaskOption: boolean
  metaMaskModalOpen: boolean
  hasOpened: boolean
  fields: any
  onSignIn: (email: string, password: string) => void
  onMetaMaskSignIn: () => void
  onViewSignUp: () => void
  onViewSignIn: () => void
  onEmailChange: (email: string, validate?: boolean) => void
  onEmailSubmitted: (email: string) => void
  onPasswordChange: (password: string) => void
  onOtpChange: (otp: string) => void
  onHandleChange: (handle: string) => void
  onNameChange: (name: string) => void
  onSetProfileImage: (img: any) => void
  setTwitterProfile: (
    uuid: string,
    profile: TwitterProfile,
    profileImg?: Image,
    coverBannerImg?: Image,
    skipEdit?: boolean
  ) => void
  setInstagramProfile: (
    uuid: string,
    profile: InstagramProfile,
    profileImg?: Image,
    skipEdit?: boolean
  ) => void
  setTikTokProfile: (
    uuid: string,
    profile: TikTokProfile,
    profileImg?: Image,
    skipEdit?: boolean
  ) => void
  recordInstagramStart: () => void
  recordTwitterStart: () => void
  recordTikTokStart: () => void
  validateHandle: (
    handle: string,
    isOauthVerified: boolean,
    onValidate?: (error: boolean) => void
  ) => void
  onAddFollows: (followIds: ID[]) => void
  onRemoveFollows: (followIds: ID[]) => void
  onAutoSelect: () => void
  onSelectArtistCategory: (category: FollowArtistsCategory) => void
  onNextPage: () => void
  suggestedFollows: User[]
}

export type MobilePages =
  | Pages.SIGNIN
  | Pages.EMAIL
  | Pages.PASSWORD
  | Pages.PROFILE
  | Pages.NOTIFICATION_SETTINGS
  | Pages.FOLLOW
  | Pages.LOADING

/**
 * TODO: When the user selects the metamask option, set the localStorage key 'useMetaMask' to true
 * Reference the setup function in Audius backend. A new instance of Audiusbackend will have to be created
 */
const SignOnPage = ({
  title,
  description,
  page,
  hasAccount,
  hasOpened,
  fields,
  onSignIn,
  onViewSignUp,
  onViewSignIn,
  onEmailChange,
  onEmailSubmitted,
  onPasswordChange,
  onOtpChange,
  onHandleChange,
  onNameChange,
  onSetProfileImage,
  setTwitterProfile,
  setInstagramProfile,
  setTikTokProfile,
  recordTwitterStart,
  recordTikTokStart,
  recordInstagramStart,
  validateHandle,
  onAddFollows,
  onRemoveFollows,
  onAutoSelect,
  onSelectArtistCategory,
  onNextPage,
  suggestedFollows: suggestedFollowEntries
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
    accountReady,
    followArtists: { selectedCategory, selectedUserIds }
  } = fields

  useEffect(() => {
    if (accountReady && page === Pages.LOADING) {
      onNextPage()
    }
  }, [accountReady, onNextPage, page])

  const pages = {
    // Captures Pages.EMAIL and Pages.SIGNIN
    init: (style: object) => (
      <animated.div
        style={{
          ...style,
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <InitialPage
          hasAccount={hasAccount}
          isLoading={status === 'loading'}
          didSucceed={status === 'success'}
          isSignIn={page === Pages.SIGNIN}
          email={email}
          password={password}
          otp={otp}
          onViewSignIn={onViewSignIn}
          onSubmitSignIn={onSignIn}
          onViewSignUp={onViewSignUp}
          onPasswordChange={onPasswordChange}
          onOtpChange={onOtpChange}
          onEmailChange={onEmailChange}
          onEmailSubmitted={onEmailSubmitted}
        />
      </animated.div>
    ),
    [Pages.PASSWORD]: (style: object) => (
      <animated.div
        style={{
          ...style,
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <Header />
        <PasswordPage
          email={email}
          password={password}
          inputStatus={''}
          onPasswordChange={onPasswordChange}
          onNextPage={onNextPage}
          onTermsOfServiceClick={() => {}}
          onPrivacyPolicyClick={() => {}}
        />
      </animated.div>
    ),
    [Pages.PROFILE]: (style: object) => (
      <animated.div
        style={{
          ...style,
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <Header />
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
    [Pages.NOTIFICATION_SETTINGS]: (style: object) => (
      <animated.div
        style={{
          ...style,
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <Header />
        <NotificationPermissionsPage
          onAllowNotifications={() => {}}
          onSkip={onNextPage}
        />
      </animated.div>
    ),
    [Pages.FOLLOW]: (style: object) =>
      // Note that the bottom section is not contained in the full page wrapper because it is
      // position fixed and the full page wrapper prevents it from sicking the bottom
      [
        <animated.div
          style={style}
          className={styles.followPageWrapper}
          key='follow'
        >
          <Header />
          <FollowPage
            users={suggestedFollowEntries}
            followedArtists={selectedUserIds}
            selectedCategory={selectedCategory}
            onSelectArtistCategory={onSelectArtistCategory}
            onAddFollows={onAddFollows}
            onRemoveFollows={onRemoveFollows}
            onAutoSelect={onAutoSelect}
          />
        </animated.div>,
        <animated.div style={{ opacity: (style as any).opacity }} key='bottom'>
          <FollowPageBottom
            followedArtists={selectedUserIds}
            onNextPage={onNextPage}
          />
        </animated.div>
      ],
    [Pages.LOADING]: (style: object) => (
      <animated.div style={style} className={styles.fullPageWrapper}>
        <LoadingPage />
      </animated.div>
    )
  }

  const isInitPage = page === Pages.EMAIL || page === Pages.SIGNIN
  const transitionPage = isInitPage ? 'init' : page
  return (
    <MobilePageContainer
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${SIGN_UP_PAGE}`}
      fullHeight
      backgroundClassName={styles.background}
      containerClassName={cn(styles.container, {
        [styles.followPage]: transitionPage === Pages.FOLLOW
      })}
    >
      <form
        className={styles.form}
        method='post'
        onSubmit={(e) => {
          e.preventDefault()
        }}
        autoComplete='off'
      >
        <div>
          <Transition
            items={transitionPage as any}
            unique
            from={{
              ...{ opacity: !hasOpened || isInitPage ? 1 : 0 },
              transform:
                page !== Pages.EMAIL && page !== Pages.SIGNIN && hasOpened
                  ? 'translate3d(100%,0,0)'
                  : 'translate3d(0,0,0)'
            }}
            enter={{
              ...{ opacity: 1 },
              transform:
                !isInitPage && hasOpened
                  ? 'translate3d(0%,0,0)'
                  : 'translate3d(0,0,0)'
            }}
            leave={{
              ...{ opacity: isInitPage ? 1 : 0 },
              transform: !isInitPage
                ? 'translate3d(-50%,0,0)'
                : 'translate3d(0,0,0)'
            }}
            config={
              page !== Pages.SIGNIN && page !== Pages.EMAIL
                ? { duration: 75 }
                : { duration: 400 }
            }
          >
            {(item: any) => (pages as any)[item]}
          </Transition>
        </div>
      </form>
    </MobilePageContainer>
  )
}

export default SignOnPage
