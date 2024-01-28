import { accountSelectors, cacheUsersSelectors } from '@audius/common'
import { createSelector } from 'reselect'

import { AppState } from 'store/types'
const { getHasAccount } = accountSelectors
const { getUsers } = cacheUsersSelectors

// Sign On selectors
export const getSignOn = (state: AppState) => state.signOn
export const getEmailField = (state: AppState) => state.signOn.email
export const getNameField = (state: AppState) => state.signOn.name
export const getPasswordField = (state: AppState) => state.signOn.password
export const getOtpField = (state: AppState) => state.signOn.otp
export const getRequiresOtp = (state: AppState) => {
  const passwordField = getPasswordField(state)
  const { error } = passwordField
  return error && error.includes('403')
}
export const getCanShowOtp = (state: AppState) => {
  const { value: email } = getEmailField(state)
  const { value: password, error } = getPasswordField(state)
  return email && password && error
}
export const getHandleField = (state: AppState) => state.signOn.handle
export const getIsVerified = (state: AppState) => state.signOn.verified
export const getCoverPhotoField = (state: AppState) => state.signOn.coverPhoto
export const getProfileImageField = (state: AppState) =>
  state.signOn.profileImage
export const getGenres = (state: AppState) => state.signOn.genres
export const getIsMobileSignOnVisible = (state: AppState) =>
  state.signOn.isMobileSignOnVisible
export const getStatus = (state: AppState) => state.signOn.status
export const getPage = (state: AppState) => state.signOn.page
export const getToastText = (state: AppState) => state.signOn.toastText
export const getRouteOnCompletion = (state: AppState) =>
  state.signOn.routeOnCompletion
export const getRouteOnExit = (state: AppState) => state.signOn.routeOnExit
export const getLinkedSocialOnFirstPage = (state: AppState) =>
  state.signOn.linkedSocialOnFirstPage
export const getIsSocialConnected = (state: AppState) =>
  !!state.signOn.twitterId ||
  !!state.signOn.tikTokId ||
  !!state.signOn.instagramId
export const getAccountReady = (state: AppState) => state.signOn.accountReady
export const getAccountAlreadyExisted = (state: AppState) =>
  state.signOn.accountAlreadyExisted
export const getStartedSignUpProcess = (state: AppState) =>
  state.signOn.startedSignUpProcess
export const getFinishedSignUpProcess = (state: AppState) =>
  state.signOn.finishedSignUpProcess
export const getReferrer = (state: AppState) => state.signOn.referrer

export const getHidePreviewHint = (state: AppState) =>
  state.signOn.hidePreviewHint
export const getFollowArtists = (state: AppState) => state.signOn.followArtists
export const getFollowIds = (state: AppState) =>
  state.signOn.followArtists.selectedUserIds

export const getSuggestedFollowIds = (state: AppState) => {
  const { selectedCategory, categories } = state.signOn.followArtists
  return categories[selectedCategory] || []
}

export const getHasCompletedAccount = createSelector(
  [getHasAccount, getStartedSignUpProcess, getFinishedSignUpProcess],
  (hasAccount, startedSignUpProcess, finishedSignUpProcess) => {
    // If a user has started the sign up flow,
    // only return true if they finish the flow
    // (including selecting followees)
    return hasAccount && (!startedSignUpProcess || finishedSignUpProcess)
  }
)

/**
 * Each lineup that invokes this selector should pass its own selector as an argument, e.g.
 *   const getLineupMetadatas = makeGetLineupMetadatas(ownProps.lineupSelector)
 *   const mapStateToProps = (state, props) => ({ lineup: getLineupMetadatas(state) })
 */
export const makeGetFollowArtists = () =>
  createSelector([getSuggestedFollowIds, getUsers], (artistIds, users) =>
    artistIds.map((aId) => users[aId]).filter(Boolean)
  )
