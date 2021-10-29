import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class RequestTwitterAuthMessage extends NativeMobileMessage {
  constructor(authURL: string) {
    super(MessageType.REQUEST_TWITTER_AUTH, { authURL })
  }
}

export class RequestTwitterAuthFailureMessage extends NativeMobileMessage {
  constructor({ error }: { error: any }) {
    super(MessageType.REQUEST_TWITTER_AUTH_FAILED, { error })
  }
}
export class RequestTwitterAuthSuccessMessage extends NativeMobileMessage {
  constructor({
    uuid,
    profile,
    profileImage,
    profileBanner,
    requiresUserReview
  }: {
    uuid: any
    profile: any
    profileImage: any
    profileBanner: any
    requiresUserReview: any
  }) {
    super(MessageType.REQUEST_TWITTER_AUTH_SUCCEEDED, {
      uuid,
      profile,
      profileImage,
      profileBanner,
      requiresUserReview
    })
  }
}
export class RequestInstagramAuthMessage extends NativeMobileMessage {
  constructor(authURL: string) {
    super(MessageType.REQUEST_INSTAGRAM_AUTH, { authURL })
  }
}
export class RequestInstagramAuthFailureMessage extends NativeMobileMessage {
  constructor({ error }: { error: any }) {
    super(MessageType.REQUEST_INSTAGRAM_AUTH_FAILED, { error })
  }
}
export class RequestInstagramAuthSuccessMessage extends NativeMobileMessage {
  constructor({
    uuid,
    profile,
    profileImage,
    requiresUserReview
  }: {
    uuid: any
    profile: any
    profileImage: any
    requiresUserReview: any
  }) {
    super(MessageType.REQUEST_INSTAGRAM_AUTH_SUCCEEDED, {
      uuid,
      profile,
      profileImage,
      requiresUserReview
    })
  }
}

export class RequestTikTokAuthMessage extends NativeMobileMessage {
  constructor(authURL: string) {
    super(MessageType.REQUEST_TIKTOK_AUTH, { authURL })
  }
}
