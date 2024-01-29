import { ChallengeName, challengeRewardsConfig } from '@audius/common'
import type { ChallengeRewardID, OptimisticUserChallenge } from '@audius/common'
import type { ImageSourcePropType } from 'react-native'
import { Platform } from 'react-native'

import {
  IconLink,
  IconArrowRight,
  IconCheck,
  IconUpload
} from '@audius/harmony-native'
import BallotBoxTick from 'app/assets/images/emojis/ballot-box-tick.png'
import Cart from 'app/assets/images/emojis/cart.png'
import BarChart from 'app/assets/images/emojis/chart-bar.png'
import ChartIncreasing from 'app/assets/images/emojis/chart-increasing.png'
import Gear from 'app/assets/images/emojis/gear.png'
import Headphone from 'app/assets/images/emojis/headphone.png'
import IncomingEnvelope from 'app/assets/images/emojis/incoming-envelope.png'
import LoveLetter from 'app/assets/images/emojis/love-letter.png'
import MobilePhoneWithArrow from 'app/assets/images/emojis/mobile-phone-with-arrow.png'
import MoneyWings from 'app/assets/images/emojis/money-with-wings.png'
import MultipleMusicalNotes from 'app/assets/images/emojis/multiple-musical-notes.png'
import ArrowUp from 'app/assets/images/emojis/right-arrow-curving-up.png'
import TrebleClef from 'app/assets/images/emojis/treble-clef.png'

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
  sendFirstTipButton: 'Send a Tip',
  sendFirstTipButtonAlt: 'Find Artists to Support' // iOS only
}

export type ChallengesParamList = {
  trending: undefined
  AccountVerificationScreen: undefined
  explore: undefined
  library: undefined
  Upload: undefined
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
      icon: IconLink,
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
        renderIcon: (color) => <IconArrowRight fill={color} />,
        iconPosition: 'right'
      }
    },
    'mobile-install': {
      icon: MobilePhoneWithArrow
    },
    'profile-completion': {
      icon: BallotBoxTick
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
      icon: MoneyWings,
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
          screen: 'library'
        }
      }
    },
    'first-playlist': {
      icon: TrebleClef,
      buttonInfo: {
        navigation: {
          screen: 'explore',
          params: { screen: 'Explore' }
        }
      }
    },
    'trending-playlist': {
      icon: ArrowUp,
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
      icon: Gear,
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
      icon: BarChart,
      buttonInfo: {
        renderIcon: (color) => <IconCheck fill={color} />,
        iconPosition: 'right'
      }
    },
    [ChallengeName.AudioMatchingBuy]: {
      icon: Cart,
      buttonInfo: {
        navigation: {
          screen: 'explore',
          params: { screen: 'PremiumTracks' }
        },
        renderIcon: (color) => <IconArrowRight fill={color} />,
        iconPosition: 'right'
      }
    },
    [ChallengeName.AudioMatchingSell]: {
      icon: Cart,
      buttonInfo: {
        navigation: {
          screen: 'Upload'
        },
        renderIcon: (color) => <IconArrowRight fill={color} />,
        iconPosition: 'right'
      }
    }
  }

export const getChallengeConfig = (id: ChallengeRewardID) => ({
  ...challengeRewardsConfig[id],
  ...mobileChallengeConfig[id]
})
