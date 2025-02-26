import { ReactNode } from 'react'

import { ChallengeName, ChallengeRewardID } from '@audius/common/models'
import { Nullable, challengeRewardsConfig, route } from '@audius/common/utils'
import {
  IconArrowRight,
  IconCheck,
  IconCloudUpload,
  IconComponent
} from '@audius/harmony'

const {
  EXPLORE_PAGE,
  EXPLORE_PREMIUM_TRACKS_PAGE,
  LIBRARY_PAGE,
  SETTINGS_PAGE,
  TRENDING_PAGE,
  UPLOAD_PAGE,
  profilePage
} = route

type LinkButtonType =
  | 'trackUpload'
  | 'profile'
  | 'verifyAccount'
  | 'trendingTracks'
  | 'sendFirstTip'
  | 'firstPlaylist'
  | ChallengeName.AudioMatchingSell
  | ChallengeName.AudioMatchingBuy

type LinkButtonInfo = {
  label: string
  leftIcon: IconComponent | null
  rightIcon: IconComponent | null
  link: (handle: string | null) => string | null
}

const linkButtonMap: Record<LinkButtonType, LinkButtonInfo> = {
  trackUpload: {
    label: 'Upload Tracks',
    leftIcon: null,
    rightIcon: IconCloudUpload,
    link: () => UPLOAD_PAGE
  },
  profile: {
    label: 'Complete Your Profile',
    leftIcon: null,
    rightIcon: IconArrowRight,
    link: (handle: Nullable<string>) => (handle ? profilePage(handle) : null)
  },
  verifyAccount: {
    label: 'Verify Your Account',
    leftIcon: null,
    rightIcon: IconCheck,
    link: () => SETTINGS_PAGE
  },
  trendingTracks: {
    label: 'Trending Tracks',
    leftIcon: null,
    rightIcon: IconArrowRight,
    link: () => TRENDING_PAGE
  },
  sendFirstTip: {
    label: 'Send a Tip',
    leftIcon: null,
    rightIcon: IconArrowRight,
    link: () => LIBRARY_PAGE
  },
  firstPlaylist: {
    label: 'Create A Playlist',
    leftIcon: null,
    rightIcon: IconArrowRight,
    link: () => EXPLORE_PAGE
  },
  [ChallengeName.AudioMatchingSell]: {
    label: 'View Premium Tracks',
    leftIcon: null,
    rightIcon: IconArrowRight,
    link: () => EXPLORE_PREMIUM_TRACKS_PAGE
  },
  [ChallengeName.AudioMatchingBuy]: {
    label: 'View Premium Tracks',
    leftIcon: null,
    rightIcon: IconArrowRight,
    link: () => EXPLORE_PREMIUM_TRACKS_PAGE
  }
}

type WebChallengeInfo = {
  icon?: ReactNode
  modalButtonInfo?: {
    incomplete: LinkButtonInfo | null
    inProgress: LinkButtonInfo | null
    complete: LinkButtonInfo | null
  }
}

const webChallengesConfig: Record<ChallengeRewardID, WebChallengeInfo> = {
  [ChallengeName.Referrals]: {},
  [ChallengeName.ReferralsVerified]: {},
  [ChallengeName.Referred]: {},
  'connect-verified': {
    modalButtonInfo: {
      incomplete: linkButtonMap.verifyAccount,
      inProgress: linkButtonMap.verifyAccount,
      complete: linkButtonMap.profile
    }
  },
  [ChallengeName.ConnectVerified]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.verifyAccount,
      inProgress: linkButtonMap.verifyAccount,
      complete: linkButtonMap.profile
    }
  },
  'listen-streak': {
    modalButtonInfo: {
      incomplete: linkButtonMap.trendingTracks,
      inProgress: linkButtonMap.trendingTracks,
      complete: linkButtonMap.trendingTracks
    }
  },
  [ChallengeName.ListenStreakEndless]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.trendingTracks,
      inProgress: linkButtonMap.trendingTracks,
      complete: linkButtonMap.trendingTracks
    }
  },
  [ChallengeName.ListenStreak]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.trendingTracks,
      inProgress: linkButtonMap.trendingTracks,
      complete: linkButtonMap.trendingTracks
    }
  },
  'mobile-install': {},
  [ChallengeName.MobileInstall]: {},
  'profile-completion': {
    modalButtonInfo: {
      incomplete: linkButtonMap.profile,
      inProgress: linkButtonMap.profile,
      complete: linkButtonMap.profile
    }
  },
  [ChallengeName.ProfileCompletion]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.profile,
      inProgress: linkButtonMap.profile,
      complete: linkButtonMap.profile
    }
  },
  'track-upload': {
    modalButtonInfo: {
      incomplete: linkButtonMap.trackUpload,
      inProgress: linkButtonMap.trackUpload,
      complete: linkButtonMap.trackUpload
    }
  },
  [ChallengeName.TrackUpload]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.trackUpload,
      inProgress: linkButtonMap.trackUpload,
      complete: linkButtonMap.trackUpload
    }
  },
  'send-first-tip': {
    modalButtonInfo: {
      incomplete: linkButtonMap.sendFirstTip,
      inProgress: linkButtonMap.sendFirstTip,
      complete: linkButtonMap.sendFirstTip
    }
  },
  [ChallengeName.FirstTip]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.sendFirstTip,
      inProgress: linkButtonMap.sendFirstTip,
      complete: linkButtonMap.sendFirstTip
    }
  },
  'first-playlist': {
    modalButtonInfo: {
      incomplete: linkButtonMap.firstPlaylist,
      inProgress: linkButtonMap.firstPlaylist,
      complete: linkButtonMap.firstPlaylist
    }
  },
  [ChallengeName.FirstPlaylist]: {
    modalButtonInfo: {
      incomplete: linkButtonMap.firstPlaylist,
      inProgress: linkButtonMap.firstPlaylist,
      complete: linkButtonMap.firstPlaylist
    }
  },
  [ChallengeName.AudioMatchingSell]: {
    modalButtonInfo: {
      incomplete: linkButtonMap[ChallengeName.AudioMatchingSell],
      inProgress: linkButtonMap[ChallengeName.AudioMatchingSell],
      complete: linkButtonMap[ChallengeName.AudioMatchingSell]
    }
  },
  [ChallengeName.AudioMatchingBuy]: {
    modalButtonInfo: {
      incomplete: linkButtonMap[ChallengeName.AudioMatchingBuy],
      inProgress: linkButtonMap[ChallengeName.AudioMatchingBuy],
      complete: linkButtonMap[ChallengeName.AudioMatchingBuy]
    }
  },
  'trending-playlist': {},
  tp: {},
  'trending-track': {},
  tt: {},
  'top-api': {},
  'verified-upload': {},
  'trending-underground': {},
  tut: {},
  [ChallengeName.OneShot]: {},
  [ChallengeName.FirstWeeklyComment]: {}
}

export const getChallengeConfig = (id: ChallengeRewardID) => ({
  ...challengeRewardsConfig[id],
  ...webChallengesConfig[id]
})
