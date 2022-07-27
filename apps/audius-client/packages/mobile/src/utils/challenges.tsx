import type { ChallengeRewardID, TrendingRewardID } from '@audius/common'
import {
  ACCOUNT_VERIFICATION_SETTINGS_PAGE,
  TRENDING_PAGE,
  EXPLORE_HEAVY_ROTATION_PAGE,
  FAVORITES_PAGE
} from 'audius-client/src/utils/route'
import type { ImageSourcePropType } from 'react-native'

import ChartIncreasing from 'app/assets/images/emojis/chart-increasing.png'
import Headphone from 'app/assets/images/emojis/headphone.png'
import IncomingEnvelope from 'app/assets/images/emojis/incoming-envelope.png'
import LoveLetter from 'app/assets/images/emojis/love-letter.png'
import MobilePhoneWithArrow from 'app/assets/images/emojis/mobile-phone-with-arrow.png'
import MoneyMouthFace from 'app/assets/images/emojis/money-mouth-face.png'
import MultipleMusicalNotes from 'app/assets/images/emojis/multiple-musical-notes.png'
import NerdFace from 'app/assets/images/emojis/nerd-face.png'
import Sparkles from 'app/assets/images/emojis/sparkles.png'
import WhiteHeavyCheckMark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconArrow from 'app/assets/images/iconArrow.svg'
import IconCheck from 'app/assets/images/iconCheck.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'

// TODO: These should be programmatic based on amount, but historically have not been
export const challenges = {
  // Connect Verified
  connectVerifiedTitle: 'Link Verified Accounts',
  connectVerifiedDescription:
    'Get verified on Audius by linking your verified Twitter or Instagram account!',
  connectVerifiedShortDescription:
    'Link your verified social media accounts to earn 1 $AUDIO',
  connectVerifiedButton: 'Verify Your Account',
  connectVerifiedProgressLabel: 'Not Linked',

  // Listen Streak
  listenStreakTitle: 'Listening Streak: 7 Days',
  listenStreakDescription:
    'Sign in and listen to at least one track every day for 7 days',
  listenStreakShortDescription:
    'Listen to one track a day for seven days to earn 1 $AUDIO',
  listenStreakButton: 'Trending Tracks',
  listenStreakProgressLabel: '%0/%1 Days',

  // Mobile Install
  mobileInstallTitle: 'Get the Audius Mobile App',
  mobileInstallDescription:
    'Install the Audius app for iPhone and Android and Sign in to your account!',
  mobileInstallShortDescription: 'Earn 1 $AUDIO',
  mobileInstallButton: 'Get the App',
  mobileInstallProgressLabel: 'Not Installed',

  // Profile Completion
  profileCompletionTitle: 'Complete Your Profile',
  profileCompletionDescription:
    'Fill out the missing details on your Audius profile and start interacting with tracks and artists!',
  profileCompletionShortDescription:
    'Complete your Audius profile to earn 1 $AUDIO',
  profileCompletionButton: 'More Info',
  profileCompletionProgressLabel: '%0/%1 Complete',

  // Referrals
  referreralsTitle: 'Invite your Friends',
  referralsDescription:
    'Invite your Friends! You’ll earn 1 $AUDIO for each friend who joins with your link (and they’ll get an $AUDIO too)',
  referralsShortDescription: 'Earn 1 $AUDIO, for you and your friend',
  referralsProgressLabel: '%0/%1 Invites Accepted',
  referralsRemainingLabel: '%0/%1 Invites Remain',
  referralsButton: 'Invite your Friends',

  // Verified Referrals
  referreralsVerifiedTitle: 'Invite your Fans',
  referralsVerifiedDescription:
    'Invite your fans! You’ll earn 1 $AUDIO for each friend who joins with your link (and they’ll get an $AUDIO too)',
  referralsVerifiedShortDescription: 'Earn up to 5,000 $AUDIO',
  referralsVerifiedProgressLabel: '%0/%1 Invites Accepted',
  referralsVerifiedRemainingLabel: '%0/%1 Invites Remain',

  // Referred
  referredTitle: 'You Accepted An Invite',
  referredDescription: 'You earned $AUDIO for being invited',
  referredShortDescription: 'You earned $AUDIO for being invited',
  referredProgressLabel: '%0/%1 Invites',

  // Track Upload
  trackUploadTitle: 'Upload 3 Tracks',
  trackUploadDescription: 'Upload 3 tracks to your profile',
  trackUploadShortDescription: 'Upload 3 tracks to your profile',
  trackUploadProgressLabel: '%0/%1 Uploaded',
  trackUploadButton: 'Upload Tracks',

  // Send First Tip
  sendFirstTipTitle: 'Send Your First Tip',
  sendFirstTipDescription:
    'Show some love to your favorite artist and send them a tip',
  sendFirstTipShortDescription:
    'Show some love to your favorite artist and send them a tip',
  sendFirstTipProgressLabel: 'Not Earned',
  sendFirstTipButton: 'Find Someone To Tip',

  firstPlaylistTitle: 'Create Your First Playlist',
  firstPlaylistDescription: 'Create your first playlist & add a track to it',
  firstPlaylistShortDescription:
    'Create your first playlist & add a track to it',
  firstPlaylistProgressLabel: 'Not Earned',
  firstPlaylistButton: 'Create Your First Playlist'
}

export type ChallengesParamList = {
  trending: undefined
  AccountVerificationScreen: undefined
  explore: undefined
  favorites: undefined
  params: { screen: string }
}

export type ChallengeConfig = {
  icon: ImageSourcePropType
  title: string
  description: string
  shortDescription?: string
  progressLabel?: string
  remainingLabel?: string
  isVerifiedChallenge?: boolean
  buttonInfo?: {
    navigation?: {
      native: {
        screen: keyof ChallengesParamList
        params?: ChallengesParamList[keyof ChallengesParamList]
      }
      web: { route: string }
    }
    label: string
    renderIcon?: (color: string) => React.ReactElement
    iconPosition?: 'left' | 'right'
  }
}

export const challengesConfig: Record<ChallengeRewardID, ChallengeConfig> = {
  'connect-verified': {
    icon: WhiteHeavyCheckMark,
    title: challenges.connectVerifiedTitle,
    description: challenges.connectVerifiedDescription,
    shortDescription: challenges.connectVerifiedShortDescription,
    progressLabel: challenges.connectVerifiedProgressLabel,
    buttonInfo: {
      label: challenges.connectVerifiedButton,
      navigation: {
        native: { screen: 'AccountVerificationScreen' },
        web: { route: ACCOUNT_VERIFICATION_SETTINGS_PAGE }
      },
      renderIcon: (color) => <IconCheck fill={color} />,
      iconPosition: 'right'
    }
  },
  'listen-streak': {
    icon: Headphone,
    title: challenges.listenStreakTitle,
    description: challenges.listenStreakDescription,
    shortDescription: challenges.listenStreakShortDescription,
    progressLabel: challenges.listenStreakProgressLabel,
    buttonInfo: {
      label: challenges.listenStreakButton,
      navigation: {
        native: { screen: 'trending' },
        web: { route: TRENDING_PAGE }
      },
      renderIcon: (color) => <IconArrow fill={color} />,
      iconPosition: 'right'
    }
  },
  'mobile-install': {
    icon: MobilePhoneWithArrow,
    title: challenges.mobileInstallTitle,
    description: challenges.mobileInstallDescription,
    shortDescription: challenges.mobileInstallShortDescription,
    progressLabel: challenges.mobileInstallProgressLabel,
    buttonInfo: {
      label: challenges.mobileInstallButton
    }
  },
  'profile-completion': {
    icon: WhiteHeavyCheckMark,
    title: challenges.profileCompletionTitle,
    description: challenges.profileCompletionDescription,
    shortDescription: challenges.profileCompletionShortDescription,
    progressLabel: challenges.profileCompletionProgressLabel,
    buttonInfo: {
      label: challenges.profileCompletionButton
    }
  },
  referrals: {
    icon: IncomingEnvelope,
    title: challenges.referreralsTitle,
    description: challenges.referralsDescription,
    shortDescription: challenges.referralsShortDescription,
    progressLabel: challenges.referralsProgressLabel,
    remainingLabel: challenges.referralsRemainingLabel,
    buttonInfo: {
      label: challenges.referralsButton
    }
  },
  'ref-v': {
    icon: IncomingEnvelope,
    title: challenges.referreralsVerifiedTitle,
    description: challenges.referralsVerifiedDescription,
    shortDescription: challenges.referralsVerifiedShortDescription,
    progressLabel: challenges.referralsVerifiedProgressLabel,
    remainingLabel: challenges.referralsVerifiedRemainingLabel,
    isVerifiedChallenge: true
  },
  referred: {
    icon: LoveLetter,
    title: challenges.referredTitle,
    description: challenges.referredDescription,
    shortDescription: challenges.referredShortDescription,
    progressLabel: challenges.referredProgressLabel
  },
  'track-upload': {
    icon: MultipleMusicalNotes,
    title: challenges.trackUploadTitle,
    description: challenges.trackUploadDescription,
    shortDescription: challenges.trackUploadShortDescription,
    progressLabel: challenges.trackUploadProgressLabel,
    buttonInfo: {
      label: challenges.trackUploadButton,
      renderIcon: (color) => <IconUpload fill={color} />,
      iconPosition: 'right'
    }
  },
  'send-first-tip': {
    icon: MoneyMouthFace,
    title: challenges.sendFirstTipTitle,
    description: challenges.sendFirstTipDescription,
    shortDescription: challenges.sendFirstTipShortDescription,
    progressLabel: challenges.sendFirstTipProgressLabel,
    buttonInfo: {
      label: challenges.sendFirstTipButton,
      navigation: {
        native: { screen: 'explore', params: { screen: 'HeavyRotation' } },
        web: { route: EXPLORE_HEAVY_ROTATION_PAGE }
      }
    }
  },
  'first-playlist': {
    icon: Sparkles,
    title: challenges.firstPlaylistTitle,
    description: challenges.firstPlaylistDescription,
    shortDescription: challenges.firstPlaylistShortDescription,
    progressLabel: challenges.firstPlaylistProgressLabel,
    buttonInfo: {
      label: challenges.firstPlaylistButton,
      navigation: {
        native: { screen: 'favorites' },
        web: { route: FAVORITES_PAGE }
      }
    }
  }
}

export const trendingRewardsConfig: Record<TrendingRewardID, ChallengeConfig> =
  {
    'trending-playlist': {
      title: 'Top 5 Trending Playlists',
      icon: ChartIncreasing,
      description: 'Winners are selected every Friday at Noon PT!',
      buttonInfo: {
        label: 'See More',
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'trending-track': {
      title: 'Top 5 Trending Tracks',
      icon: ChartIncreasing,
      description: 'Winners are selected every Friday at Noon PT!',
      buttonInfo: {
        label: 'See More',
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'top-api': {
      title: 'Top 10 API Apps',
      icon: NerdFace,
      description: 'The top 10 Audius API apps each month win',
      buttonInfo: {
        label: 'More Info',
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'verified-upload': {
      title: 'First Upload With Your Verified Account',
      icon: ChartIncreasing,
      description:
        'Verified on Twitter/Instagram? Upload your first track, post it on social media, & tag us',
      buttonInfo: {
        label: 'See More',
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'trending-underground': {
      title: 'Top 5 Underground Trending',
      icon: ChartIncreasing,
      description: 'Winners are selected every Friday at Noon PT!',
      buttonInfo: {
        label: 'See More',
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    }
  }
