import { challengeRewardsConfig } from '@audius/common'
import type { ChallengeRewardID, OptimisticUserChallenge } from '@audius/common'
import type { ImageSourcePropType } from 'react-native'
import { Platform } from 'react-native'

import ChartIncreasing from 'app/assets/images/emojis/chart-increasing.png'
import Headphone from 'app/assets/images/emojis/headphone.png'
import IncomingEnvelope from 'app/assets/images/emojis/incoming-envelope.png'
import LoveLetter from 'app/assets/images/emojis/love-letter.png'
import MobilePhoneWithArrow from 'app/assets/images/emojis/mobile-phone-with-arrow.png'
import MoneyMouthFace from 'app/assets/images/emojis/money-mouth-face.png'
import MultipleMusicalNotes from 'app/assets/images/emojis/multiple-musical-notes.png'
import NerdFace from 'app/assets/images/emojis/nerd-face.png'
import TrebleClef from 'app/assets/images/emojis/treble-clef.png'
import WhiteHeavyCheckMark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconArrow from 'app/assets/images/iconArrow.svg'
import IconCheck from 'app/assets/images/iconCheck.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'

export const messages = {
  sendFirstTipTitle: 'Send Your First Tip',
  // NOTE: Send tip -> Send $AUDIO change
  sendFirstTipTitleAlt: 'Send Your First $AUDIO', // iOS only
  sendFirstTipDescription:
    'Show some love to your favorite artist and send them a tip',
  sendFirstTipShortDescription:
    'Show some love to your favorite artist and send them a tip',
  sendFirstTipDescriptionAlt:
    'Show some love to your favorite artist and send them $AUDIO', // iOS only
  sendFirstTipShortDescriptionAlt:
    'Show some love to your favorite artist and send them $AUDIO', // iOS only
  sendFirstTipButton: 'Find Someone To Tip',
  sendFirstTipButtonAlt: 'Find Someone To Send To' // iOS only
}

export type ChallengesParamList = {
  trending: undefined
  AccountVerificationScreen: undefined
  explore: undefined
  favorites: undefined
  params: { screen: string }
}

export type MobileChallengeConfig = {
  icon?: ImageSourcePropType
  title?: string
  description?: (amount?: OptimisticUserChallenge) => string
  shortDescription?: string
  panelButtonText?: string
  buttonInfo?: {
    navigation?: {
      screen: keyof ChallengesParamList
      params?: ChallengesParamList[keyof ChallengesParamList]
    }
    renderIcon?: (color: string) => React.ReactElement
    iconPosition?: 'left' | 'right'
  }
}

const mobileChallengeConfig: Record<ChallengeRewardID, MobileChallengeConfig> =
  {
    'connect-verified': {
      icon: WhiteHeavyCheckMark,
      buttonInfo: {
        navigation: {
          screen: 'AccountVerificationScreen'
        },
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'listen-streak': {
      icon: Headphone,
      buttonInfo: {
        navigation: {
          screen: 'trending'
        },
        renderIcon: (color) => <IconArrow fill={color} />,
        iconPosition: 'right'
      }
    },
    'mobile-install': {
      icon: MobilePhoneWithArrow
    },
    'profile-completion': {
      icon: WhiteHeavyCheckMark
    },
    referrals: {
      icon: IncomingEnvelope
    },
    'ref-v': {
      icon: IncomingEnvelope
    },
    referred: {
      icon: LoveLetter
    },
    'track-upload': {
      icon: MultipleMusicalNotes,
      buttonInfo: {
        renderIcon: (color) => <IconUpload fill={color} />,
        iconPosition: 'right'
      }
    },
    'send-first-tip': {
      icon: MoneyMouthFace,
      title:
        Platform.OS === 'ios'
          ? messages.sendFirstTipTitleAlt
          : messages.sendFirstTipTitle,
      description: () =>
        Platform.OS === 'ios'
          ? messages.sendFirstTipDescriptionAlt
          : messages.sendFirstTipDescription,
      shortDescription:
        Platform.OS === 'ios'
          ? messages.sendFirstTipShortDescriptionAlt
          : messages.sendFirstTipShortDescription,
      panelButtonText:
        Platform.OS === 'ios'
          ? messages.sendFirstTipButtonAlt
          : messages.sendFirstTipButton,
      buttonInfo: {
        navigation: {
          screen: 'explore',
          params: { screen: 'HeavyRotation' }
        }
      }
    },
    'first-playlist': {
      icon: TrebleClef,
      buttonInfo: {
        navigation: {
          screen: 'favorites'
        }
      }
    },
    'trending-playlist': {
      icon: ChartIncreasing,
      buttonInfo: {
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'trending-track': {
      icon: ChartIncreasing,
      buttonInfo: {
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'top-api': {
      icon: NerdFace,
      buttonInfo: {
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'verified-upload': {
      title: 'First Upload With Your Verified Account',
      icon: ChartIncreasing,
      buttonInfo: {
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    'trending-underground': {
      icon: ChartIncreasing,
      buttonInfo: {
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    }
  }

export const getChallengeConfig = (id: ChallengeRewardID) => ({
  ...challengeRewardsConfig[id],
  ...mobileChallengeConfig[id]
})
