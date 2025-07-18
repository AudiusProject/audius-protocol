import { TOKEN_LISTING_MAP } from '@audius/common/store'
import { IconGift } from '@audius/harmony'

import { TOKENS } from 'components/buy-sell-modal/constants'

export const ACCEPTED_ROUTES = {
  audio: {
    title: '$AUDIO',
    symbol: TOKEN_LISTING_MAP.AUDIO.symbol,
    icon: TOKENS.AUDIO.icon,
    name: TOKENS.AUDIO.name,
    userId: 51
  },
  bonk: {
    title: '$BONK',
    symbol: 'BONK',
    icon: TOKENS.BONK.icon,
    name: TOKENS.BONK.name,
    userId: null
  }
}

export const ASSET_INFO_SECTION_MESSAGES = {
  default: {
    createdBy: 'Created By',
    whatIs: (asset: string) => `What is ${asset}?`
  },
  audio: {
    description: [
      '$AUDIO is the token that powers Audius. Earn $AUDIO for free by completing in-app challenges and winning weekly trending competitions.',
      "You can use $AUDIO for tipping, and as your balance grows, you'll move up rewards tiers that unlock perks like flair, custom themes, and more. Holding $AUDIO also gives you a voice in community votes, helping shape Audius and the future of the music industry."
    ],
    cta: 'Browse Rewards',
    ctaIcon: IconGift
  },
  usdc: {
    description: [
      '$USDC is a stablecoin pegged to the US Dollar. It provides stability and is commonly used for trading and transactions.',
      'You can use $USDC for purchasing other tokens, tipping artists, and as a stable store of value within the Audius ecosystem.'
    ],
    cta: 'Learn More',
    ctaIcon: IconGift
  },
  bonk: {
    description: [
      '$BONK is a community-driven meme token on Solana. It has gained popularity for its vibrant community and ecosystem.',
      'You can use $BONK for trading, tipping, and participating in the broader Solana DeFi ecosystem through Audius.'
    ],
    cta: 'Learn More',
    ctaIcon: IconGift
  }
}
