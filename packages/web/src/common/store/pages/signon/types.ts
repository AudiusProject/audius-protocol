import { ID, User } from '@audius/common'

import { ImageFieldValue } from 'pages/sign-up-page/components/ImageField'

export enum EditingStatus {
  EDITING = 'editing',
  LOADING = 'loading',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

export interface EditableField<T = string> {
  value: T
  error: string
  status: EditingStatus
}

export enum FollowArtistsCategory {
  FEATURED = 'Featured',
  ALL_GENRES = 'All Genres',
  ELECTRONIC = 'Electronic',
  HIP_HOP_RAP = 'Hip-Hop/Rap',
  ALTERNATIVE = 'Alternative',
  POP = 'Pop'
}

// Order list fo the enum above
export const artistCategories = [
  FollowArtistsCategory.FEATURED,
  FollowArtistsCategory.ALL_GENRES,
  FollowArtistsCategory.ELECTRONIC,
  FollowArtistsCategory.HIP_HOP_RAP,
  FollowArtistsCategory.ALTERNATIVE,
  FollowArtistsCategory.POP
]

export type FollowArtists = {
  selectedCategory: FollowArtistsCategory
  categories: {
    [key in FollowArtistsCategory]?: ID[]
  }
  selectedUserIds: ID[]
}

export default interface SignOnPageState {
  email: EditableField
  name: EditableField
  password: EditableField
  handle: EditableField
  genres: string[]
  verified: boolean
  useMetaMask: boolean
  accountReady: boolean
  twitterId: string
  tikTokId: string
  instagramId: string
  linkedSocialOnFirstPage: boolean
  twitterScreenName: string
  profileImage: EditableField<ImageFieldValue>
  coverPhoto: EditableField<ImageFieldValue>
  suggestedFollowIds: ID[]
  suggestedFollowEntries: User[]
  followIds: ID[]
  status: EditingStatus
  toastText: string | null
  followArtists: FollowArtists
  isMobileSignOnVisible: boolean
  routeOnCompletion: boolean
  startedSignUpProcess: boolean
  finishedPhase1: boolean
  /** @deprecated */
  finishedSignUpProcess: boolean
  routeOnExit: boolean
  page: number
  referrer: string
}

export type { SignOnPageState }

export type SignOnPageReducer = (
  state: SignOnPageState,
  action: unknown
) => SignOnPageState

export enum Pages {
  SIGNIN = 'SIGNIN',
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  PROFILE = 'PROFILE',
  FOLLOW = 'FOLLOW',
  LOADING = 'LOADING',
  START = 'START',
  NOTIFICATION_SETTINGS = 'NOTIFICATION_SETTINGS',
  APP_CTA = 'APP_CTA'
}
