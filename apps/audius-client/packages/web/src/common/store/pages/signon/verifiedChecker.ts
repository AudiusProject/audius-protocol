import { Nullable } from '@audius/common'

type TwitterUser = {
  verified: boolean
}

type InstagramUser = {
  is_verified: boolean
}

type HandleCheckStatus = 'twitterReserved' | 'instagramReserved' | 'notReserved'

export const checkHandle = (
  isOauthVerified: boolean,
  lookedUpTwitterUser: Nullable<TwitterUser>,
  lookedUpInstagramUser: Nullable<InstagramUser>
): HandleCheckStatus => {
  const isEquivalentTwitterHandleVerified =
    lookedUpTwitterUser && lookedUpTwitterUser.verified

  const isEquivalentInstagramHandleVerified =
    lookedUpInstagramUser && lookedUpInstagramUser.is_verified

  if (!isOauthVerified) {
    if (isEquivalentTwitterHandleVerified) {
      return 'twitterReserved'
    }
    if (isEquivalentInstagramHandleVerified) {
      return 'instagramReserved'
    }
  }
  return 'notReserved'
}
