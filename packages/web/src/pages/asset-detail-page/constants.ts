import { TOKEN_LISTING_MAP } from '@audius/common/store'
import { IconGift, IconTokenAUDIO, IconTokenBonk } from '@audius/harmony'

export const ACCEPTED_ROUTES = {
  audio: {
    title: '$AUDIO',
    symbol: TOKEN_LISTING_MAP.AUDIO.symbol,
    icon: IconTokenAUDIO,
    name: 'Audius',
    userId: 51
  },
  bonk: {
    title: '$BONK',
    symbol: 'BONK',
    icon: IconTokenBonk,
    name: 'Bonk',
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
  bonk: {
    description: [
      '$BONK is a community-driven meme token on Solana. It has gained popularity for its vibrant community and ecosystem.',
      'You can use $BONK for trading, tipping, and participating in the broader Solana DeFi ecosystem through Audius.'
    ],
    cta: 'Learn More',
    ctaIcon: IconGift
  }
}
