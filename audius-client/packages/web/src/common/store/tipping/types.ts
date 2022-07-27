import {
  ID,
  RecentTipsStorage,
  Supporter,
  Supporting,
  UserTip,
  User,
  StringAudio,
  Nullable
} from '@audius/common'

export type TippingSendStatus =
  | 'SEND'
  | 'CONFIRM'
  | 'SENDING'
  | 'CONVERTING'
  | 'SUCCESS'
  | 'ERROR'

/**
 * Example for supporters map (and similarly supporting map):
 * {
 *   one: {
 *     two: <supporter object for user two>
 *     three: <supporter object for user three>
 *   },
 *   four: {
 *     two: <supporter object for user two>
 *     three: <supporter object for user three>
 *   }
 * }
 *
 * The above means that users 'two' and 'three' are supporters of users 'one' and 'four'.
 * The same structure applies to supporting.
 * Structured it this way to make it easy to check whether a user
 * is supported by / supports another user.
 */
export type SupportersMapForUser = Record<ID, Supporter>
export type SupportersMap = Record<ID, SupportersMapForUser>

export type SupportingMapForUser = Record<ID, Supporting>
export type SupportingMap = Record<ID, SupportingMapForUser>

export type TippingState = {
  supporters: SupportersMap
  supportersOverrides: SupportersMap
  supporting: SupportingMap
  supportingOverrides: SupportingMap
  send: {
    status: Nullable<TippingSendStatus>
    user: Nullable<User>
    amount: StringAudio
    error: Nullable<string>
    source: 'profile' | 'feed'
  }
  recentTips: UserTip[]
  storage: Nullable<RecentTipsStorage> // what is cached in the web or mobile local storage
  tipToDisplay: Nullable<UserTip>
  showTip: boolean
}
