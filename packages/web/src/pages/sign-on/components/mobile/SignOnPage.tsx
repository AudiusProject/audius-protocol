import { useEffect, useCallback } from 'react'

import { ID } from '@audius/common'
import cn from 'classnames'
import { connect } from 'react-redux'
import { animated } from 'react-spring'
import { Transition } from 'react-spring/renderprops'
import { Dispatch } from 'redux'

import { User } from 'common/models/User'
import {
  AccountImage,
  InstagramProfile,
  TwitterProfile
} from 'common/store/account/reducer'
import * as settingPageActions from 'common/store/pages/settings/actions'
import { PushNotificationSetting } from 'common/store/pages/settings/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import FollowPage, {
  BottomSection as FollowPageBottom
} from 'pages/sign-on/components/mobile/FollowPage'
import Header from 'pages/sign-on/components/mobile/Header'
import InitialPage from 'pages/sign-on/components/mobile/InitialPage'
import NotificationPermissionsPage from 'pages/sign-on/components/mobile/NotificationPermissionsPage'
import PasswordPage from 'pages/sign-on/components/mobile/PasswordPage'
import ProfilePage from 'pages/sign-on/components/mobile/ProfilePage'
import { Pages, FollowArtistsCategory } from 'pages/sign-on/store/types'
import { PromptPushNotificationPermissions } from 'services/native-mobile-interface/notifications'
import { BASE_URL, SIGN_UP_PAGE } from 'utils/route'

import LoadingPage from './LoadingPage'
import styles from './SignOnPage.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

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
  recordInstagramStart: () => void
  recordTwitterStart: () => void
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
  onHandleChange,
  onNameChange,
  onSetProfileImage,
  setTwitterProfile,
  setInstagramProfile,
  recordTwitterStart,
  recordInstagramStart,
  validateHandle,
  onAddFollows,
  onRemoveFollows,
  onAutoSelect,
  onSelectArtistCategory,
  onNextPage,
  suggestedFollows: suggestedFollowEntries,
  togglePushNotificationSetting
}: SignOnProps & ReturnType<typeof mapDispatchToProps>) => {
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

  const onAllowNotifications = useCallback(() => {
    if (NATIVE_MOBILE) {
      if (page === Pages.SIGNIN) {
        // Trigger enable push notifs drawer
        new PromptPushNotificationPermissions().send()
      } else {
        // Sign up flow
        // Enable push notifications (will trigger device popup)
        togglePushNotificationSetting(PushNotificationSetting.MobilePush, true)
        onNextPage()
      }
    }
  }, [togglePushNotificationSetting, onNextPage, page])

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
        }}>
        <InitialPage
          hasAccount={hasAccount}
          isLoading={status === 'loading'}
          didSucceed={status === 'success'}
          isSignIn={page === Pages.SIGNIN}
          email={email}
          password={password}
          onViewSignIn={onViewSignIn}
          onSubmitSignIn={onSignIn}
          onViewSignUp={onViewSignUp}
          onPasswordChange={onPasswordChange}
          onEmailChange={onEmailChange}
          onAllowNotifications={onAllowNotifications}
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
        }}>
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
        }}>
        <Header />
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
          recordInstagramStart={recordInstagramStart}
          validateHandle={validateHandle}
          onNextPage={onNextPage}
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
        }}>
        <Header />
        <NotificationPermissionsPage
          onAllowNotifications={onAllowNotifications}
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
          key='follow'>
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
      })}>
      <form
        className={styles.form}
        method='post'
        onSubmit={(e) => {
          e.preventDefault()
        }}
        autoComplete='off'>
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
            }>
            {(item: any) => (pages as any)[item]}
          </Transition>
        </div>
      </form>
    </MobilePageContainer>
  )
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    togglePushNotificationSetting: (
      notificationType: PushNotificationSetting,
      isOn: boolean
    ) =>
      dispatch(
        settingPageActions.togglePushNotificationSetting(notificationType, isOn)
      )
  }
}

export default connect(null, mapDispatchToProps)(SignOnPage)
