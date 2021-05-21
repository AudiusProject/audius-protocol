import React, { Component } from 'react'
import { connect } from 'react-redux'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'
import { UnregisterCallback } from 'history'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { setupHotkeys, removeHotkeys } from 'utils/hotkeyUtil'
import {
  push as pushRoute,
  replace as replaceRoute,
  goBack
} from 'connected-react-router'
import {
  SignOnProps as MobileSignOnProps,
  MobilePages
} from './components/mobile/SignOnPage'
import {
  SignOnProps as DesktopSignOnProps,
  ValidDesktopPages
} from './components/desktop/SignOnPage'
import { ID } from 'models/common/Identifiers'
import { make, TrackEvent } from 'store/analytics/actions'
import { Name } from 'services/analytics'
import { isElectron } from 'utils/clientUtil'
import { showPushNotificationConfirmation } from 'store/account/reducer'
import { Pages, FollowArtistsCategory } from 'containers/sign-on/store/types'
import { sampleSize } from 'lodash'
import User from 'models/User'
import {
  getSignOn,
  getIsMobileSignOnVisible,
  getToastText,
  makeGetFollowArtists,
  getRouteOnExit
} from './store/selectors'
import * as signOnAction from './store/actions'
import {
  TRENDING_PAGE,
  UPLOAD_PAGE,
  FEED_PAGE,
  SIGN_IN_PAGE,
  SIGN_UP_PAGE
} from 'utils/route'
import { getHasAccount } from 'store/account/selectors'

const messages = {
  title: 'Sign Up',
  description: 'Create an account or sign into your account on Audius'
}

const META_MASK_SETUP_URL =
  'https://medium.com/@audius/configuring-metamask-for-use-with-audius-91e24bf6840'

type OwnProps = {
  children:
    | React.ComponentType<MobileSignOnProps>
    | React.ComponentType<DesktopSignOnProps>
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
    const { isMobile, replaceRoute, hasAccount } = this.props
    if (hasAccount) {
      replaceRoute(TRENDING_PAGE)
    }
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
    if (page === Pages.PROFILE) {
      const {
        signUp,
        recordCompleteProfile,
        fields: { email, password, handle }
      } = this.props
      // Dispatch event to create account
      signUp(email.value, password.value, handle.value)
      recordCompleteProfile(email.value, handle.value)
    }
    if (page === Pages.FOLLOW) {
      const {
        followArtists: { selectedUserIds },
        email,
        handle
      } = this.props.fields
      this.props.followArtists(selectedUserIds)
      this.props.recordCompleteFollow(
        selectedUserIds.join('|'),
        selectedUserIds.length,
        email.value,
        handle.value
      )
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

  handleOnContinue = (page: Pages) => {
    return () => {
      const { email } = this.props.fields
      if (page === Pages.PASSWORD) {
        this.props.recordCompleteEmail(email.value)
      } else if (page === Pages.PROFILE) {
        this.props.recordCompletePassword(email.value)
      }
      this.addRouteHash(page)
      this.props.goToPage(page)
    }
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

  onNameChange = (name: string) => this.props.setValueField('name', name)
  onSetProfileImage = (img: any) => this.props.setField('profileImage', img)
  onHandleChange = (handle: string) => {
    this.props.setValueField('handle', handle)
    if (handle) this.props.validateHandle(handle)
  }

  finishSignup = () => {
    const { sendWelcomeEmail, fields } = this.props
    sendWelcomeEmail(fields.name.value)
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
    profile: { screen_name?: string; verified?: boolean },
    profileImage: any,
    coverPhoto: any
  ) => {
    const {
      fields: { email, handle }
    } = this.props
    if (profile.screen_name) this.props.validateHandle(profile.screen_name)
    this.props.setTwitterProfile(twitterId, profile, profileImage, coverPhoto)
    this.props.recordTwitterComplete(
      !!profile.verified,
      email.value,
      handle.value
    )
  }

  onRecordTwitterStart = () => {
    const { email } = this.props.fields
    this.props.recordTwitterStart(email.value)
  }

  setInstagramProfile = (
    instagramId: string,
    profile: { username?: string; is_verified?: boolean },
    profileImage?: any
  ) => {
    if (profile.username) this.props.validateHandle(profile.username)
    this.props.setInstagramProfile(instagramId, profile, profileImage)
  }

  onMetaMaskSignIn = () => {
    this.props.goToRoute(FEED_PAGE)
    window.location.reload()
  }

  render() {
    // Note: Typescript complains that web3 property does not exist on window
    const showMetaMaskOption = !!(window as any).web3
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
      handleOnContinue: this.handleOnContinue,
      onPrevPage: this.onPrevPage,
      onConfigureWithMetaMask: this.onConfigureWithMetaMask,
      onEmailChange: this.onEmailChange,
      onPasswordChange: this.onPasswordChange,
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
      onMetaMaskSignIn: this.onMetaMaskSignIn,
      recordTwitterStart: this.onRecordTwitterStart,
      recordTwitterComplete: this.props.recordTwitterComplete
    }
    if (this.props.isMobile) {
      const Children = this.props.children as React.ComponentType<
        MobileSignOnProps
      >
      return <Children {...childProps} {...mobileProps} />
    } else {
      const Children = this.props.children as React.ComponentType<
        DesktopSignOnProps
      >
      return <Children {...childProps} {...desktopProps} />
    }
  }
}

function makeMapStateToProps(state: AppState) {
  const getSuggestedFollows = makeGetFollowArtists()
  return {
    suggestedFollows: getSuggestedFollows(state, {}),
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
    onSignIn: (email: string, password: string) =>
      dispatch(signOnAction.signIn(email, password)),
    fetchFollowArtists: () => dispatch(signOnAction.fetchAllFollowArtists()),
    signUp: (email: string, password: string, handle: string) =>
      dispatch(signOnAction.signUp(email, password, handle)),
    setTwitterProfile: (
      twitterId: string,
      profile: object,
      profileImage: object,
      coverPhoto: string
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
      profile: object,
      profileImage?: object
    ) =>
      dispatch(
        signOnAction.setInstagramProfile(instagramId, profile, profileImage)
      ),
    sendWelcomeEmail: (name: string) =>
      dispatch(signOnAction.sendWelcomeEmail(name)),
    validateEmail: (email: string) =>
      dispatch(signOnAction.validateEmail(email)),
    validateHandle: (handle: string) =>
      dispatch(signOnAction.validateHandle(handle)),
    setValueField: (field: string, value: any) =>
      dispatch(signOnAction.setValueField(field, value)),
    setField: (field: string, value: any) =>
      dispatch(signOnAction.setField(field, value)),
    resetSignOn: () => dispatch(signOnAction.resetSignOn()),
    nextPage: (isMobile: boolean) => dispatch(signOnAction.nextPage(isMobile)),
    previousPage: () => dispatch(signOnAction.previousPage()),
    goToPage: (page: Pages) => dispatch(signOnAction.goToPage(page)),
    followArtists: (userIds: ID[]) =>
      dispatch(signOnAction.followArtists(userIds)),
    addFollows: (userIds: ID[]) =>
      dispatch(signOnAction.addFollowArtists(userIds)),
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
    recordCompleteEmail: (emailAddress: string) => {
      const trackEvent: TrackEvent = make(Name.CREATE_ACCOUNT_COMPLETE_EMAIL, {
        emailAddress
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
