import {
  SignonActions,
  SIGN_IN_FAILED,
  SIGN_IN_FAILED_RESET,
  SET_HANDLE_STATUS,
  VALIDATE_EMAIL_SUCEEDED,
  VALIDATE_EMAIL_FAILED,
  VALIDATE_HANDLE_SUCEEDED,
  VALIDATE_HANDLE_FAILED,
  FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED,
  FETCH_ALL_FOLLOW_ARTISTS_FAILED,
  SIGN_UP_SUCCEEDED,
  SET_FOLLOW_ARTISTS_CATEGORY,
  SET_FOLLOWED_ARTISTS,
  SET_USERS_TO_FOLLOW,
  SET_ACCOUNT_AVAILABLE,
  RESET_SIGNON_STATE,
  SignupHandleStatusType,
  SET_EMAIL_STATUS,
  SignupEmailStatusType
} from './actions'
import { FollowArtistsCategory } from './types'

export type SignonState = {
  isError: boolean
  emailIsAvailable: boolean
  emailIsValid: boolean
  handleIsValid: boolean
  emailStatus: SignupEmailStatusType
  handleStatus: SignupHandleStatusType
  handleError: string
  accountAvailable: boolean
  userId: number | null
  followArtists: {
    selectedCategory: FollowArtistsCategory
    categories: { [key in FollowArtistsCategory]?: number[] }
    selectedUserIds: number[]
    usersToFollow: any[]
  }
  finalEmail: string
  finalHandle: string
}

const initialSignonState: SignonState = {
  isError: false,
  emailIsAvailable: true,
  emailIsValid: false,
  handleIsValid: false,
  emailStatus: 'editing' as 'editing',
  handleError: '',
  handleStatus: 'editing' as 'editing',
  accountAvailable: false,
  userId: 0,
  followArtists: {
    selectedCategory: FollowArtistsCategory.FEATURED,
    categories: {},
    selectedUserIds: [],
    usersToFollow: []
  },
  finalEmail: '',
  finalHandle: ''
}

const reducer = (
  state: SignonState = initialSignonState,
  action: SignonActions
) => {
  switch (action.type) {
    case SIGN_IN_FAILED:
      return {
        ...state,
        isError: true
      }
    case SIGN_IN_FAILED_RESET:
      return {
        ...state,
        isError: false
      }
    case SET_EMAIL_STATUS:
      return {
        ...state,
        emailStatus: action.status
      }
    case VALIDATE_EMAIL_SUCEEDED:
      return {
        ...state,
        emailIsAvailable: action.available,
        emailIsValid: true,
        emailStatus: 'done'
      }
    case VALIDATE_EMAIL_FAILED:
      return {
        ...state,
        emailIsAvailable: true,
        emailIsValid: false,
        emailStatus: 'done'
      }
    case SET_HANDLE_STATUS:
      return {
        ...state,
        handleStatus: action.status
      }
    case VALIDATE_HANDLE_SUCEEDED:
      return {
        ...state,
        handleIsValid: true,
        handleStatus: 'done',
        handleError: ''
      }
    case VALIDATE_HANDLE_FAILED:
      return {
        ...state,
        handleIsValid: false,
        handleStatus: 'done',
        handleError: action.error
      }
    case FETCH_ALL_FOLLOW_ARTISTS_SUCCEEDED:
      return {
        ...state,
        followArtists: {
          ...state.followArtists,
          categories: {
            ...state.followArtists.categories,
            [action.category]: action.userIds
          }
        }
      }
    case FETCH_ALL_FOLLOW_ARTISTS_FAILED:
      return {
        ...state,
        followArtists: {
          ...state.followArtists
        }
      }
    case SET_FOLLOW_ARTISTS_CATEGORY:
      return {
        ...state,
        followArtists: {
          ...state.followArtists,
          selectedCategory: action.category
        }
      }
    case SET_FOLLOWED_ARTISTS:
      return {
        ...state,
        followArtists: {
          ...state.followArtists,
          selectedUserIds: action.userIds
        }
      }
    case SET_USERS_TO_FOLLOW:
      return {
        ...state,
        followArtists: {
          ...state.followArtists,
          usersToFollow: action.users
        }
      }
    case SET_ACCOUNT_AVAILABLE:
      return {
        ...state,
        accountAvailable: action.isAvailable,
        // for analytics tracking purposes
        finalEmail: action.finalEmail,
        finalHandle: action.finalHandle
      }
    case SIGN_UP_SUCCEEDED:
      return {
        ...state,
        userId: action.userId
      }
    case RESET_SIGNON_STATE:
      return {
        ...initialSignonState
      }
    default:
      return state
  }
}

export default reducer
