import { ID } from '@audius/common'

import { User } from 'common/models/User'

enum EditingStatus {
  EDITING = 'editing',
  LOADING = 'loading',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

interface EditableField {
  value: string
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

export default interface SignOnPageState {
  email: EditableField
  name: EditableField
  password: EditableField
  handle: EditableField
  verified: boolean
  useMetaMask: boolean
  accountReady: boolean
  twitterId: string
  twitterScreenName: string
  profileImage: { file: File; url: string }
  coverPhoto: { file: File; url: string }
  suggestedFollowIds: ID[]
  suggestedFollowEntries: User[]
  followIds: ID[]
  status: EditingStatus
  toastText: string | null
  followArtists: {
    selectedCategory: FollowArtistsCategory
    categories: {
      [key in keyof typeof FollowArtistsCategory]?: ID[]
    }
    selectedUserIds: ID[]
  }
}

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
