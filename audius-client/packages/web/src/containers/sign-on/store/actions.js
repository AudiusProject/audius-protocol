export const SET_FIELD = 'SIGN_ON/SET_FIELD'
export const SET_VALUE_FIELD = 'SIGN_ON/SET_VALUE_FIELD'
export const RESET_SIGN_ON = 'SIGN_ON/RESET_SIGN_ON'

export const VALIDATE_EMAIL = 'SIGN_ON/VALIDATE_EMAIL'
export const VALIDATE_EMAIL_IN_USE = 'SIGN_ON/VALIDATE_EMAIL_IN_USE'
export const VALIDATE_EMAIL_SUCCEEDED = 'SIGN_ON/VALIDATE_EMAIL_SUCCEEDED'
export const VALIDATE_EMAIL_FAILED = 'SIGN_ON/VALIDATE_EMAIL_FAILED'

export const VALIDATE_HANDLE = 'SIGN_ON/VALIDATE_HANDLE'
export const VALIDATE_HANDLE_SUCCEEDED = 'SIGN_ON/VALIDATE_HANDLE_SUCCEEDED'
export const VALIDATE_HANDLE_FAILED = 'SIGN_ON/VALIDATE_HANDLE_FAILED'

export const FOLLOW_ARTISTS = 'SIGN_ON/FOLLOW_ARTISTS'
export const SET_ACCOUNT_READY = 'SIGN_ON/SET_ACCOUNT_READY'

export const CHECK_EMAIL = 'SIGN_ON/CHECK_EMAIL'

export const SIGN_IN = 'SIGN_ON/SIGN_IN'
export const SIGN_IN_SUCCEEDED = 'SIGN_ON/SIGN_IN_SUCCEEDED'
export const SIGN_IN_FAILED = 'SIGN_ON/SIGN_IN_FAILED'

export const SIGN_UP = 'SIGN_ON/SIGN_UP'
export const SIGN_UP_SUCCEEDED = 'SIGN_ON/SIGN_UP_SUCCEEDED'
export const SIGN_UP_SUCCEEDED_WITH_ID = 'SIGN_ON/SIGN_UP_SUCCEEDED_WITH_ID'
export const SIGN_UP_FAILED = 'SIGN_ON/SIGN_UP_FAILED'
export const SIGN_UP_TIMEOUT = 'SIGN_ON/SIGN_UP_TIMEOUT'

export const SET_TWITTER_PROFILE = 'SIGN_ON/SET_TWITTER_PROFILE'
export const SET_TWITTER_PROFILE_ERROR = 'SIGN_ON/SET_TWITTER_PROFILE_ERROR'
export const SET_INSTAGRAM_PROFILE = 'SIGN_ON/SET_INSTAGRAM_PROFILE'
export const SET_INSTAGRAM_PROFILE_ERROR = 'SIGN_ON/SET_INSTAGRAM_PROFILE_ERROR'

export const SET_STATUS = 'SIGN_ON/SET_STATUS'
export const CONFIGURE_META_MASK = 'SIGN_ON/CONFIGURE_META_MASK'

export const OPEN_SIGN_ON = 'SIGN_ON/OPEN_SIGN_ON'

export const NEXT_PAGE = 'SIGN_ON/NEXT_PAGE'
export const PREVIOUS_PAGE = 'SIGN_ON/PREVIOUS_PAGE'
export const GO_TO_PAGE = 'SIGN_ON/GO_TO_PAGE'

export const SET_TOAST = 'SIGN_ON/SET_TOAST'
export const UPDATE_ROUTE_ON_COMPLETION = 'SIGN_ON/UPDATE_ROUTE_ON_COMPLETION'
export const UPDATE_ROUTE_ON_EXIT = 'SIGN_ON/UPDATE_ROUTE_ON_EXIT'

export const GET_USERS_TO_FOLLOW = 'SIGN_ON/GET_USERS_TO_FOLLOW'
export const SET_USERS_TO_FOLLOW = 'SIGN_ON/SET_USERS'
export const FETCH_ALL_FOLLOW_ARTISTS = 'SIGN_ON/FETCH_ALL_FOLLOW_ARTISTS'
export const FETCH_FOLLOW_ARTISTS_SUCCEEDED =
  'SIGN_ON/FETCH_FOLLOW_ARTISTS_SUCCEEDED'
export const FETCH_FOLLOW_ARTISTS_FAILED = 'SIGN_ON/FETCH_FOLLOW_ARTISTS_FAILED'
export const SET_FOLLOW_ARTIST_CATEGORY = 'SIGN_ON/SET_FOLLOW_ARTIST_CATEGORY'
export const ADD_FOLLOW_ARTISTS = 'SIGN_ON/ADD_FOLLOW_ARTISTS'
export const REMOVE_FOLLOW_ARTISTS = 'SIGN_ON/REMOVE_FOLLOW_ARTISTS'

export const SEND_WELCOME_EMAIL = 'SIGN_ON/SEND_WELCOME_EMAIL'

export const FETCH_REFERRER = 'SIGN_ON/FETCH_REFERRER'
export const SET_REFERRER = 'SIGN_ON/SET_REFERRER'

/**
 * Sets athe value for a field in the sign on state
 * @param {string} field the field to be set
 * @param {any} value the value to be set
 */
export function setValueField(field, value) {
  return { type: SET_VALUE_FIELD, field, value }
}

/**
 * Sets the value for a field in the sign on state
 * @param {string} field the field to be set
 * @param {any} value the value to be set
 */
export function setField(field, value) {
  return { type: SET_FIELD, field, value }
}

/**
 * Sets a field in the signin flow
 * @param {string} field the field to be set
 * @param {any} value the value to be set
 */
export function resetSignOn() {
  return { type: RESET_SIGN_ON }
}

export function checkEmail(email) {
  return { type: CHECK_EMAIL, email }
}

/**
 * Requests the backend to check if email is valid
 * @param {string} email the email to check
 */
export function validateEmail(email) {
  return { type: VALIDATE_EMAIL, email }
}

export function validateEmailInUse(email) {
  return { type: VALIDATE_EMAIL_IN_USE, email }
}

export function validateEmailSucceeded(available) {
  return { type: VALIDATE_EMAIL_SUCCEEDED, available }
}

/**
 * Email is not valid
 * @param {string} error The reason the email is not vallid
 */
export function validateEmailFailed(error) {
  return { type: VALIDATE_EMAIL_FAILED, error }
}

/**
 * Requests the backend to check if handle is valid
 * @param {string} handle the handle to check
 * @param {boolean} isOauthVerified whether or not the user is verified via oauth
 * @param {((error: boolean) => void) | undefined} onValidate
 *  callback to fire on successful validation
 */
export function validateHandle(handle, isOauthVerified, onValidate) {
  return { type: VALIDATE_HANDLE, handle, isOauthVerified, onValidate }
}

export function validateHandleSucceeded() {
  return { type: VALIDATE_HANDLE_SUCCEEDED }
}

/**
 * handle is not valid
 * @param {string} error The reason the handle is not valid
 */
export function validateHandleFailed(error) {
  return { type: VALIDATE_HANDLE_FAILED, error }
}

/**
 * sign up
 * takes params from store signon state
 */
export function signUp() {
  return { type: SIGN_UP }
}

export const signUpSucceeded = () => ({ type: SIGN_UP_SUCCEEDED })
export function signUpSucceededWithId(userId) {
  return { type: SIGN_UP_SUCCEEDED_WITH_ID, userId }
}
export const signUpFailed = (error, phase) => ({
  type: SIGN_UP_FAILED,
  error,
  phase
})

/**
 * Attemp sign-in to the account
 * @param {string} email account email
 * @param {string} password account password
 */
export function signIn(email, password) {
  return { type: SIGN_IN, email, password }
}

export const signInSucceeded = () => ({ type: SIGN_IN_SUCCEEDED })
export const signInFailed = (error, phase, shouldReport = true) => ({
  type: SIGN_IN_FAILED,
  error,
  phase,
  shouldReport
})

/**
 * Requests all the follow artist metadata is fetched
 */
export function fetchAllFollowArtists() {
  return { type: FETCH_ALL_FOLLOW_ARTISTS }
}

/**
 * Requests all the users from which to pick suggested followed artists
 */
export function getUsersToFollow() {
  return { type: GET_USERS_TO_FOLLOW }
}

/**
 * Requests all the users from which to pick suggested followed artists
 */
export function setUsersToFollow(users) {
  return { type: SET_USERS_TO_FOLLOW, users }
}

/**
 * Set the user ids for the follow artists category
 * @param {artistFollowCatgory} category The genre category to set the user ids for
 * @param {Array<ID>} userIds The top user ids for a category
 */
export function fetchFollowArtistsSucceeded(category, userIds) {
  return { type: FETCH_FOLLOW_ARTISTS_SUCCEEDED, category, userIds }
}

/**
 * Sets the Follow artist category
 * @param {artistFollowCatgory} category The genre category to display to the user
 */
export function setFollowAristsCategory(category) {
  return { type: SET_FOLLOW_ARTIST_CATEGORY, category }
}

/**
 * error response
 * @param {string} error The error for fetch follow artists
 */
export function fetchFollowArtistsFailed(error) {
  return { type: FETCH_FOLLOW_ARTISTS_FAILED, error }
}

export function setTwitterProfile(
  twitterId,
  profile,
  profileImage,
  coverPhoto
) {
  return {
    type: SET_TWITTER_PROFILE,
    twitterId,
    profile,
    profileImage,
    coverPhoto
  }
}

export function setTwitterProfileError(error) {
  return { type: SET_TWITTER_PROFILE_ERROR, error }
}

export function setInstagramProfile(instagramId, profile, profileImage) {
  return {
    type: SET_INSTAGRAM_PROFILE,
    instagramId,
    profile,
    profileImage
  }
}

export function setInstagramProfileError(error) {
  return { type: SET_INSTAGRAM_PROFILE_ERROR, error }
}

/**
 * Follows users in signup flow after user is created
 * @param {arrayOf(string)} userIds array of userIds to follow
 */
export function followArtists(userIds) {
  return { type: FOLLOW_ARTISTS, userIds }
}

/**
 * Sets the status of the signon flow 'loading' or 'editing'
 * @param {string} status Status: 'loading' or 'editing'
 */
export function setStatus(status) {
  return { type: SET_STATUS, status }
}

/**
 * Sets the status of the signon flow 'loading' or 'editing'
 * @param {string} status Status: 'loading' or 'editing'
 */
export function configureMetaMask() {
  return { type: CONFIGURE_META_MASK }
}

/**
 * Sets the accout status as ready, when the account is created and the followers are confirmed
 */
export function setAccountReady() {
  return { type: SET_ACCOUNT_READY }
}

/**
 * Adds the user ids to be followed on account completion
 * @param {Array<ID>} userIds The user ids to add as selected and follow
 */
export function addFollowArtists(userIds) {
  return { type: ADD_FOLLOW_ARTISTS, userIds }
}

/**
 * Removes the user ids from the selected userIds array
 * @param {Array<ID>} userIds The user ids to remove from selected
 */
export function removeFollowArtists(userIds) {
  return { type: REMOVE_FOLLOW_ARTISTS, userIds }
}

/**
 * Sets a toast appearing over signon
 */
export const showToast = text => ({
  type: SET_TOAST,
  text
})

/**
 * Clears a toast appearing over signon
 */
export const clearToast = () => ({
  type: SET_TOAST,
  text: null
})

export const showRequiresAccountModal = () => ({
  type: SET_TOAST,
  text: 'Oops, it looks like you need an account to do that!'
})

/**
 * Opens the signin/up modal in mobile and routes to the page on desktop
 * @param {boolean} signIn Determines if the SignIn or SignUp flow is displayed
 * @param {string} page optional page to open sign on to
 * @param {object} fields optional fields to set in the sign in state when opening
 */
export const openSignOn = (signIn = false, page = null, fields = {}) => {
  return { type: OPEN_SIGN_ON, signIn, page, fields }
}

export const nextPage = isMobile => ({ type: NEXT_PAGE, isMobile })
export const previousPage = () => ({ type: PREVIOUS_PAGE })
export const goToPage = page => ({ type: GO_TO_PAGE, page })

export const signUpTimeout = () => ({ type: SIGN_UP_TIMEOUT })
export const updateRouteOnCompletion = route => ({
  type: UPDATE_ROUTE_ON_COMPLETION,
  route
})
export const updateRouteOnExit = route => ({
  type: UPDATE_ROUTE_ON_EXIT,
  route
})

export const sendWelcomeEmail = name => ({
  type: SEND_WELCOME_EMAIL,
  name
})

/**
 * Fetches the referring user given their handle
 * @param {string} handle
 *  the handle captured by the ?ref=<handle> search param
 */
export const fetchReferrer = handle => ({
  type: FETCH_REFERRER,
  handle
})

/**
 * Sets the user id of the referrer who invited this user signing up
 * @param {ID} userId
 */
export const setReferrer = userId => ({
  type: SET_REFERRER,
  userId
})
