import { Component, ComponentType } from 'react'

import { Name, ID, User } from '@audius/common/models'
import {
  accountActions,
  accountSelectors,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile,
  Image
} from '@audius/common/store'
import {
  push as pushRoute,
  replace as replaceRoute,
  goBack
} from 'connected-react-router'
import { UnregisterCallback } from 'history'
import { sampleSize } from 'lodash'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { make, TrackEvent } from 'common/store/analytics/actions'
import * as signOnAction from 'common/store/pages/signon/actions'
import {
  getSignOn,
  getIsMobileSignOnVisible,
  getToastText,
  makeGetFollowArtists,
  getRouteOnExit
} from 'common/store/pages/signon/selectors'
import { Pages, FollowArtistsCategory } from 'common/store/pages/signon/types'
import { AppState } from 'store/types'
import { isElectron } from 'utils/clientUtil'
import { setupHotkeys, removeHotkeys } from 'utils/hotkeyUtil'
import {
  TRENDING_PAGE,
  UPLOAD_PAGE,
  FEED_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE
} from 'utils/route'

import {
  SignOnProps as DesktopSignOnProps,
  ValidDesktopPages
} from './components/desktop/SignOnPage'
import {
  SignOnProps as MobileSignOnProps,
  MobilePages
} from './components/mobile/SignOnPage'

const { showPushNotificationConfirmation } = accountActions
const getHasAccount = accountSelectors.getHasAccount

const messages = {
  title: 'Sign Up',
  description: 'Create an account or sign into your account on Audius'
}

const META_MASK_SETUP_URL =
  'https://help.audius.co/help/Configuring-MetaMask-For-Use-With-Audius-2d446'

type OwnProps = {
  children: ComponentType<MobileSignOnProps> | ComponentType<DesktopSignOnProps>
  signIn: boolean
  initialPage: boolean
  isMobile: boolean
  page?: Pages
}

type SignOnProps = OwnProps &
  ReturnType<typeof makeMapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type SignOnState = {
  metaMaskModalOpen: boolean
  hasOpened: boolean
  initialPage: boolean
  closeModalHotkey?: Function
}

/**
 * TODO: When the user selects the metamask option, set the localStorage key 'useMetaMask' to true
 * Reference the setup function in Audius backend. A new instance of Audiusbackend will have to be created
 */
export class SignOnProvider extends Component<SignOnProps, SignOnState> {
  static defaultProps = {
    signIn: false,
    initialPage: false
  }

  unlisten!: UnregisterCallback

  state: SignOnState = {
    metaMaskModalOpen: false,
    hasOpened: false,
    initialPage: this.props.initialPage
  }

  onToggleMetaMaskModal = () => {
    const {
      fields: { email }
    } = this.props
    if (email.status === 'success') {
      this.setState({ metaMaskModalOpen: !this.state.metaMaskModalOpen })
    }
  }

  onClickReadMetaMaskConfig = () => {
    const win = window.open(META_MASK_SETUP_URL, '_blank')
    if (win) win.focus()
  }

  componentDidMount() {
    const { isMobile } = this.props

    this.unlisten = this.props.history.listen(() => {
      if (isMobile) {
        if (!this.hasRouteHash()) {
          this.onResetMobileView()
        }
      }
    })

    const closeModalHotkey = setupHotkeys({
      27 /* Escape */: () => {
        if (
          this.props.page !== Pages.FOLLOW &&
          this.props.page !== Pages.LOADING &&
          this.props.page !== Pages.START
        ) {
          if (!this.props.isMobile) {
            this.closeModal()
          }
        }
      }
    })
    this.setState({ closeModalHotkey })
  }

  UNSAFE_componentWillMount() {
    this.props.fetchFollowArtists()
    this.setState({ hasOpened: true })
  }

  componentWillUnmount() {
    const { closeModalHotkey } = this.state
    if (closeModalHotkey) removeHotkeys(closeModalHotkey)
    this.props.clearToast()
    if (this.unlisten) this.unlisten()
  }

  closeModal = () => {
    this.props.resetSignOn()
    if (this.state.initialPage) {
      this.props.goToRoute(TRENDING_PAGE)
    } else if (this.props.routeOnExit) {
      // @ts-ignore
      this.props.goToRoute(this.props.routeOnExit)
    } else {
      // Go back a route
      this.props.goBack()
    }
  }

  /**
   * Some autocomplete services (iCloud keychain) won't keep the password saved
   * unless there is a URL change before typing into another input field.
   * Because the profile page (display name + handle) comes after password, we
   * use this #hash as a fake URL redirect so the autocomplete can save the password.
   */
  addRouteHash = (page?: Pages) => {
    if (page) {
      this.props.history.replace(
        // In the case of hash routing, this is still ok and will append #page
        // to the existing route, e.g. /#/signup#page
        this.props.history.location.pathname + `#${page.toLowerCase()}`
      )
    }
  }

  hasRouteHash = () => {
    return !!this.props.history.location.hash
  }

  removeRouteHash = () => {
    this.props.history.replace(this.props.history.location.pathname)
  }

  onNextPage = () => {
    const { page, isMobile } = this.props
    if (page === Pages.PASSWORD) {
      const {
        fields: { email },
        recordCompletePassword
      } = this.props
      recordCompletePassword(email.value)
    }
    if (page === Pages.PROFILE) {
      const {
        signUp,
        recordCompleteProfile,
        fields: { email, handle }
      } = this.props

      // Dispatch event to create account
      signUp()
      recordCompleteProfile(email.value, handle.value)
    }
    if (page === Pages.FOLLOW) {
      const {
        fields: {
          followArtists: { selectedUserIds },
          email,
          handle
        },
        completeFollowArtists
      } = this.props

      this.props.recordCompleteFollow(
        selectedUserIds.join('|'),
        selectedUserIds.length,
        email.value,
        handle.value
      )
      completeFollowArtists()
    }
    if (page === Pages.LOADING) {
      const { email, handle } = this.props.fields
      this.props.recordCompleteCreating(email.value, handle.value)
      if (isMobile) {
        // Immediately go to the listening view because we don't
        // support uploads on mobile
        this.onStartListening()
        return
      }
    }
    this.addRouteHash(page)
    this.props.nextPage(isMobile)
  }

  onPrevPage = () => {
    this.props.previousPage()
  }

  onConfigureWithMetaMask = () => {
    this.props.onSetupMetaMask()
    this.props.goToPage(Pages.PROFILE)
  }

  onEmailChange = (email: string, validate = true) => {
    this.props.setValueField('email', email)
    if (validate) this.props.validateEmail(email)
  }

  onPasswordChange = (password: string) => {
    this.props.setValueField('password', password)
  }

  onOtpChange = (otp: string) => {
    this.props.setValueField('otp', otp)
  }

  onNameChange = (name: string) => this.props.setValueField('name', name)
  onSetProfileImage = (img: any) => this.props.setField('profileImage', img)
  onHandleChange = (handle: string) => {
    this.props.setValueField('handle', handle)
    if (handle) this.props.validateHandle(handle, false)
  }

  finishSignup = () => {
    // Remove the route hash if it's present
    if (this.hasRouteHash()) {
      this.removeRouteHash()
    }
  }

  onUploadTrack = () => {
    const { email, handle } = this.props.fields
    this.finishSignup()
    this.props.goToRoute(UPLOAD_PAGE)
    this.props.recordGoToUpload()
    this.props.recordFinish('upload', email.value, handle.value)
    if (!this.props.isMobile && !isElectron())
      this.props.showPushNotificationConfirmation()
  }

  onStartListening = () => {
    const { email, handle } = this.props.fields
    this.finishSignup()
    this.props.goToRoute(FEED_PAGE)
    this.props.recordFinish('listen', email.value, handle.value)
    if (!this.props.isMobile && !isElectron())
      this.props.showPushNotificationConfirmation()
  }

  onViewSignIn = () => {
    this.props.resetSignOn()
    this.props.replaceRoute(SIGN_IN_PAGE)
    this.props.recordSignInClick()
  }

  onSelectArtistCategory = (category: FollowArtistsCategory) => {
    this.props.setFollowAristsCategory(category)
  }

  // The autoselect or 'pick for me'
  // Selects the first three aritsts in the current category along with 2 additinal
  // random artist from the top 10
  onAutoSelect = () => {
    const {
      suggestedFollows,
      fields: {
        followArtists: { selectedUserIds }
      }
    } = this.props
    const selectedIds = new Set(selectedUserIds)
    const firstThreeUsers = suggestedFollows
      .slice(0, 3)
      .map((user: User) => user.user_id)
      .filter((userId: ID) => !selectedIds.has(userId))

    const suggestedUserIds = suggestedFollows
      .slice(3, 10)
      .map((user: User) => user.user_id)
      .filter((userId: ID) => !selectedIds.has(userId))

    const followUsers = firstThreeUsers.concat(sampleSize(suggestedUserIds, 2))
    this.props.addFollows(followUsers)
  }

  onViewSignUp = () => {
    this.props.resetSignOn()
    this.props.replaceRoute(SIGN_UP_PAGE)
    this.props.recordSignUpClick()
  }

  onResetMobileView = () => {
    this.props.resetSignOn()
    this.props.goToPage(Pages.EMAIL)
  }

  setTwitterProfile = (
    twitterId: string,
    profile: TwitterProfile,
    profileImg?: Image,
    coverBannerImg?: Image,
    skipEdit?: boolean
  ) => {
    const {
      fields: { email }
    } = this.props
    this.props.setTwitterProfile(twitterId, profile, profileImg, coverBannerImg)
    this.props.recordTwitterComplete(
      !!profile.verified,
      email.value,
      profile.screen_name || 'unknown'
    )
    if (skipEdit) {
      this.onNextPage()
    }
  }

  onRecordTwitterStart = () => {
    const { email } = this.props.fields
    this.props.recordTwitterStart(email.value)
  }

  onRecordInstagramStart = () => {
    const { email } = this.props.fields
    this.props.recordInstagramStart(email.value)
  }

  onRecordTikTokStart = () => {
    const { email } = this.props.fields
    this.props.recordTikTokStart(email.value)
  }

  setInstagramProfile = (
    instagramId: string,
    profile: InstagramProfile,
    profileImg?: Image,
    skipEdit?: boolean
  ) => {
    const {
      fields: { email }
    } = this.props
    this.props.setInstagramProfile(instagramId, profile, profileImg)
    this.props.recordInstagramComplete(
      !!profile.is_verified,
      email.value,
      profile.username || 'unknown'
    )

    if (skipEdit) {
      this.onNextPage()
    }
  }

  setTikTokProfile = (
    tikTokId: string,
    profile: TikTokProfile,
    profileImg?: Image,
    skipEdit?: boolean
  ) => {
    const {
      fields: { email }
    } = this.props
    this.props.setTikTokProfile(tikTokId, profile, profileImg)
    this.props.recordTikTokComplete(
      !!profile.is_verified,
      email.value,
      profile.username || 'unknown'
    )
    if (skipEdit) {
      this.onNextPage()
    }
  }

  onMetaMaskSignIn = () => {
    this.props.goToRoute(FEED_PAGE)
    window.location.reload()
  }

  render() {
    // Note: Typescript complains that web3 property does not exist on window
    const showMetaMaskOption = !!window.ethereum
    const page = this.props.signIn ? Pages.SIGNIN : this.props.page

    const mobileProps = {
      page: page as MobilePages,
      onResetMobileView: this.onResetMobileView
    }

    const desktopProps = {
      page: page as ValidDesktopPages
    }

    const childProps = {
      title: messages.title,
      description: messages.description,
      showMetaMaskOption,
      hasAccount: this.props.hasAccount,

      // Props from state & props
      initialPage: this.state.initialPage,
      metaMaskModalOpen: this.state.metaMaskModalOpen,
      hasOpened: this.state.hasOpened,

      signIn: this.props.signIn,
      suggestedFollows: this.props.suggestedFollows,
      fields: this.props.fields,
      onSignIn: this.props.onSignIn,

      toastText: this.props.toastText,

      // Props from class methods
      onToggleMetaMaskModal: this.onToggleMetaMaskModal,
      onClickReadMetaMaskConfig: this.onClickReadMetaMaskConfig,
      closeModal: this.closeModal,
      onNextPage: this.onNextPage,
      onPrevPage: this.onPrevPage,
      onConfigureWithMetaMask: this.onConfigureWithMetaMask,
      onEmailChange: this.onEmailChange,
      onEmailSubmitted: this.props.onEmailSubmitted,
      onPasswordChange: this.onPasswordChange,
      onOtpChange: this.onOtpChange,
      onNameChange: this.onNameChange,
      onAddFollows: this.props.addFollows,
      onRemoveFollows: this.props.removeFollows,
      onAutoSelect: this.onAutoSelect,
      onSelectArtistCategory: this.props.setFollowAristsCategory,
      onSetProfileImage: this.onSetProfileImage,
      onHandleChange: this.onHandleChange,
      finishSignup: this.finishSignup,
      onUploadTrack: this.onUploadTrack,
      onStartListening: this.onStartListening,
      onViewSignIn: this.onViewSignIn,
      onViewSignUp: this.onViewSignUp,
      setTwitterProfile: this.setTwitterProfile,
      setInstagramProfile: this.setInstagramProfile,
      setTikTokProfile: this.setTikTokProfile,
      validateHandle: this.props.validateHandle,
      onMetaMaskSignIn: this.onMetaMaskSignIn,
      recordTwitterStart: this.onRecordTwitterStart,
      recordInstagramStart: this.onRecordInstagramStart,
      recordTikTokStart: this.onRecordTikTokStart
    }
    if (this.props.isMobile) {
      const Children = this.props.children as ComponentType<MobileSignOnProps>
      return <Children {...childProps} {...mobileProps} />
    } else {
      const Children = this.props.children as ComponentType<DesktopSignOnProps>
      // @ts-ignore
      return <Children {...childProps} {...desktopProps} />
    }
  }
}

function makeMapStateToProps(state: AppState) {
  const getSuggestedFollows = makeGetFollowArtists()
  return {
    suggestedFollows: getSuggestedFollows(state),
    fields: getSignOn(state),
    isMobileSignOnVisible: getIsMobileSignOnVisible(state),
    toastText: getToastText(state),
    hasAccount: getHasAccount(state),
    routeOnExit: getRouteOnExit(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    onEmailSubmitted: (email: string) =>
      dispatch(signOnAction.checkEmail(email)),
    onSignIn: (email: string, password: string) =>
      dispatch(signOnAction.signIn(email, password)),
    fetchFollowArtists: () => dispatch(signOnAction.fetchAllFollowArtists()),
    fetchReferrer: (handle: string) =>
      dispatch(signOnAction.fetchReferrer(handle)),
    signUp: () => dispatch(signOnAction.signUp()),
    setTwitterProfile: (
      twitterId: string,
      profile: TwitterProfile,
      profileImage?: Image,
      coverPhoto?: Image
    ) =>
      dispatch(
        signOnAction.setTwitterProfile(
          twitterId,
          profile,
          profileImage,
          coverPhoto
        )
      ),
    setInstagramProfile: (
      instagramId: string,
      profile: InstagramProfile,
      profileImage?: Image
    ) =>
      dispatch(
        signOnAction.setInstagramProfile(instagramId, profile, profileImage)
      ),
    setTikTokProfile: (
      tikTokId: string,
      profile: TikTokProfile,
      profileImage?: Image
    ) =>
      dispatch(signOnAction.setTikTokProfile(tikTokId, profile, profileImage)),
    validateEmail: (email: string) =>
      dispatch(signOnAction.validateEmail(email)),
    validateHandle: (
      handle: string,
      isOauthVerified: boolean,
      onValidate?: (error: boolean) => void
    ) =>
      dispatch(
        signOnAction.validateHandle(handle, isOauthVerified, onValidate)
      ),
    setValueField: (field: string, value: any) =>
      dispatch(signOnAction.setValueField(field, value)),
    setField: (field: string, value: any) =>
      dispatch(signOnAction.setField(field, value)),
    resetSignOn: () => dispatch(signOnAction.resetSignOn()),
    nextPage: (isMobile: boolean) => dispatch(signOnAction.nextPage(isMobile)),
    previousPage: () => dispatch(signOnAction.previousPage()),
    goToPage: (page: Pages) => dispatch(signOnAction.goToPage(page)),
    addFollows: (userIds: ID[]) =>
      dispatch(signOnAction.addFollowArtists(userIds)),
    completeFollowArtists: () => dispatch(signOnAction.completeFollowArtists()),
    removeFollows: (userIds: ID[]) =>
      dispatch(signOnAction.removeFollowArtists(userIds)),
    onSetupMetaMask: () => dispatch(signOnAction.configureMetaMask()),
    clearToast: () => dispatch(signOnAction.clearToast()),
    setFollowAristsCategory: (category: FollowArtistsCategory) =>
      dispatch(signOnAction.setFollowAristsCategory(category)),
    showPushNotificationConfirmation: () =>
      dispatch(showPushNotificationConfirmation()),
    goBack: () => dispatch(goBack()),
    replaceRoute: (route: string) => dispatch(replaceRoute(route)),
    recordSignInClick: () => {
      const trackEvent: TrackEvent = make(Name.SIGN_IN_OPEN, {
        source: 'sign up page' as const
      })
      dispatch(trackEvent)
    },
    recordSignUpClick: () => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_OPEN, {
        source: 'sign in page' as const
      })
      dispatch(trackEvent)
    },
    recordGoToUpload: () => {
      const trackEvent: TrackEvent = make(Name.TRACK_UPLOAD_OPEN, {
        source: 'signup' as const
      })
      dispatch(trackEvent)
    },
    recordCompletePassword: (emailAddress: string) => {
      const trackEvent: TrackEvent = make(
        Name.CREATE_ACCOUNT_COMPLETE_PASSWORD,
        { emailAddress }
      )
      dispatch(trackEvent)
    },
    recordCompleteProfile: (emailAddress: string, handle: string) => {
      const trackEvent: TrackEvent = make(
        Name.CREATE_ACCOUNT_COMPLETE_PROFILE,
        { emailAddress, handle }
      )
      dispatch(trackEvent)
    },
    recordTwitterStart: (emailAddress: string) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_START_TWITTER, {
        emailAddress
      })
      dispatch(trackEvent)
    },
    recordTwitterComplete: (
      isVerified: boolean,
      emailAddress: string,
      handle: string
    ) => {
      const trackEvent: TrackEvent = make(
        Name.CREATE_ACCOUNT_COMPLETE_TWITTER,
        { isVerified, emailAddress, handle }
      )
      dispatch(trackEvent)
    },
    recordInstagramStart: (emailAddress: string) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_START_INSTAGRAM, {
        emailAddress
      })
      dispatch(trackEvent)
    },
    recordInstagramComplete: (
      isVerified: boolean,
      emailAddress: string,
      handle: string
    ) => {
      const trackEvent: TrackEvent = make(
        Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM,
        { isVerified, emailAddress, handle }
      )
      dispatch(trackEvent)
    },
    recordTikTokStart: (emailAddress: string) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_START_TIKTOK, {
        emailAddress
      })
      dispatch(trackEvent)
    },
    recordTikTokComplete: (
      isVerified: boolean,
      emailAddress: string,
      handle: string
    ) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_COMPLETE_TIKTOK, {
        isVerified,
        emailAddress,
        handle
      })
      dispatch(trackEvent)
    },
    recordCompleteFollow: (
      users: string,
      count: number,
      emailAddress: string,
      handle: string
    ) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_COMPLETE_FOLLOW, {
        users,
        count,
        emailAddress,
        handle
      })
      dispatch(trackEvent)
    },
    recordCompleteCreating: (emailAddress: string, handle: string) => {
      const trackEvent: TrackEvent = make(
        Name.CREATE_ACCOUNT_COMPLETE_CREATING,
        { emailAddress, handle }
      )
      dispatch(trackEvent)
    },
    recordFinish: (
      enterMode: 'upload' | 'listen',
      emailAddress: string,
      handle: string
    ) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_FINISH, {
        enterMode,
        emailAddress,
        handle
      })
      dispatch(trackEvent)
    }
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(SignOnProvider)
)
