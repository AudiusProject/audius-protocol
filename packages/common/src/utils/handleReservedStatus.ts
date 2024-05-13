import { InstagramUser, TikTokUser, TwitterUser } from '~/models/User'

import { Nullable } from './typeUtils'

export type HandleCheckStatus =
  | 'twitterReserved'
  | 'instagramReserved'
  | 'tikTokReserved'
  | 'notReserved'

export const parseHandleReservedStatusFromSocial = ({
  isOauthVerified,
  lookedUpTwitterUser,
  lookedUpInstagramUser,
  lookedUpTikTokUser
}: {
  isOauthVerified: boolean
  lookedUpTwitterUser: Nullable<TwitterUser>
  lookedUpInstagramUser: Nullable<InstagramUser>
  lookedUpTikTokUser: Nullable<TikTokUser>
}): HandleCheckStatus => {
  const isEquivalentTwitterHandleVerified =
    lookedUpTwitterUser && lookedUpTwitterUser.verified

  const isEquivalentInstagramHandleVerified =
    lookedUpInstagramUser && lookedUpInstagramUser.is_verified

  const isEquivalentTikTokHandleVerified =
    lookedUpTikTokUser && lookedUpTikTokUser.verified

  if (!isOauthVerified) {
    if (isEquivalentTwitterHandleVerified) {
      return 'twitterReserved'
    }
    if (isEquivalentInstagramHandleVerified) {
      return 'instagramReserved'
    }
    if (isEquivalentTikTokHandleVerified) {
      return 'tikTokReserved'
    }
  }
  return 'notReserved'
}
