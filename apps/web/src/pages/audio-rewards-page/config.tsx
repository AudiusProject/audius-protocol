import { ReactNode } from 'react'

import {
  ChallengeRewardID,
  Nullable,
  challengeRewardsConfig
} from '@audius/common'
import { IconArrow, IconCheck, IconUpload } from '@audius/stems'

import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import {
  profilePage,
  SETTINGS_PAGE,
  TRENDING_PAGE,
  UPLOAD_PAGE,
  FAVORITES_PAGE
} from 'utils/route'

type LinkButtonType =
  | 'trackUpload'
  | 'profile'
  | 'verifyAccount'
  | 'trendingTracks'
  | 'sendFirstTip'
  | 'firstPlaylist'
type LinkButtonInfo = {
  label: string
  leftIcon: ReactNode | null
  rightIcon: ReactNode | null
  link: (handle: string | null) => string | null
}

const GoldBadgeIconImage = () => (
  <img
    draggable={false}
    alt='Gold badge'
    src={IconGoldBadge}
    width={24}
    height={24}
  />
)

const linkButtonMap: Record<LinkButtonType, LinkButtonInfo> = {
  trackUpload: {
    label: 'Upload Tracks',
    leftIcon: null,
    rightIcon: <IconUpload />,
    link: () => UPLOAD_PAGE
  },
  profile: {
    label: 'Your Profile',
    leftIcon: null,
    rightIcon: <IconArrow />,
    link: (handle: Nullable<string>) => (handle ? profilePage(handle) : null)
  },
  verifyAccount: {
    label: 'Verify Your Account',
    leftIcon: null,
    rightIcon: <IconCheck />,
    link: () => SETTINGS_PAGE
  },
  trendingTracks: {
    label: 'Trending Tracks',
    leftIcon: null,
    rightIcon: <IconArrow />,
    link: () => TRENDING_PAGE
  },
  sendFirstTip: {
    label: 'Find Someone To Tip',
    leftIcon: null,
    rightIcon: <GoldBadgeIconImage />,
    link: () => FAVORITES_PAGE
  },
  firstPlaylist: {
    label: 'Discover Some Tracks',
    leftIcon: null,
    rightIcon: <IconArrow />,
    link: () => FAVORITES_PAGE
  }
}

type WebChallengeInfo = {
  icon: ReactNode
  modalButtonInfo?: {
    incomplete: LinkButtonInfo | null
    inProgress: LinkButtonInfo | null
    complete: LinkButtonInfo | null
  }
}

const webChallengesConfig: Record<ChallengeRewardID, WebChallengeInfo> = {
  referrals: {
    icon: <i className='emoji large incoming-envelope' />
  },
  'ref-v': {
    icon: <i className='emoji large incoming-envelope' />
  },
  referred: {
    icon: <i className='emoji large love-letter' />
  },
  'connect-verified': {
    icon: <i className='emoji large link-symbol' />,
    modalButtonInfo: {
      incomplete: linkButtonMap.verifyAccount,
      inProgress: linkButtonMap.verifyAccount,
      complete: linkButtonMap.profile
    }
  },
  'listen-streak': {
    icon: <i className='emoji large headphone' />,
    modalButtonInfo: {
      incomplete: linkButtonMap.trendingTracks,
      inProgress: linkButtonMap.trendingTracks,
      complete: linkButtonMap.trendingTracks
    }
  },
  'mobile-install': {
    icon: <i className='emoji large mobile-phone-with-arrow' />
  },
  'profile-completion': {
    icon: <i className='emoji large ballot-box-tick' />,
    modalButtonInfo: {
      incomplete: linkButtonMap.profile,
      inProgress: linkButtonMap.profile,
      complete: linkButtonMap.profile
    }
  },
  'track-upload': {
    icon: <i className='emoji large multiple-musical-notes' />,
    modalButtonInfo: {
      incomplete: linkButtonMap.trackUpload,
      inProgress: linkButtonMap.trackUpload,
      complete: linkButtonMap.trackUpload
    }
  },
  'send-first-tip': {
    icon: <i className='emoji large money-wings' />,
    modalButtonInfo: {
      incomplete: linkButtonMap.sendFirstTip,
      inProgress: linkButtonMap.sendFirstTip,
      complete: linkButtonMap.sendFirstTip
    }
  },
  'first-playlist': {
    icon: <i className='emoji large treble-clef' />,
    modalButtonInfo: {
      incomplete: linkButtonMap.firstPlaylist,
      inProgress: linkButtonMap.firstPlaylist,
      complete: linkButtonMap.firstPlaylist
    }
  },
  'trending-playlist': {
    icon: <i className='emoji large arrow-curve-up' />
  },
  'trending-track': {
    icon: <i className='emoji large chart-increasing' />
  },
  'top-api': {
    icon: <i className='emoji large gear' />
  },
  'verified-upload': {
    icon: <i className='emoji large white-heavy-check-mark' />
  },
  'trending-underground': {
    icon: <i className='emoji large chart-bar' />
  }
}

export const getChallengeConfig = (id: ChallengeRewardID) => ({
  ...challengeRewardsConfig[id],
  ...webChallengesConfig[id]
})
