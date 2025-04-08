import { IconLogoCircle, IconLogoCircleUSDC } from '@audius/harmony'

import { TokenInfo, TokenPair } from './types'

export const messages = {
  title: 'BUY / SELL',
  buy: 'Buy',
  sell: 'Sell',
  youPay: 'You Pay',
  youReceive: 'You Receive',
  amountUSDC: 'Amount (USDC)',
  amountAUDIO: 'Amount (AUDIO)',
  max: 'MAX',
  available: 'Available',
  audioTicker: '$AUDIO',
  usdcTicker: 'USDC',
  continue: 'Continue',
  poweredBy: 'POWERED BY',
  helpCenter: 'Check out our help center for more info!',
  walletGuide: 'Wallet Guide',
  selectPair: 'Select Token Pair'
}

// Token metadata
export const TOKENS: Record<string, TokenInfo> = {
  AUDIO: {
    symbol: 'AUDIO',
    name: 'Audius',
    icon: IconLogoCircle,
    decimals: 18,
    balance: 0, // This will be updated with actual balance
    isStablecoin: false
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: IconLogoCircleUSDC,
    decimals: 6,
    balance: 0, // This will be updated with actual balance
    isStablecoin: true
  }
}

// Define supported token pairs
export const SUPPORTED_TOKEN_PAIRS: TokenPair[] = [
  {
    baseToken: TOKENS.AUDIO,
    quoteToken: TOKENS.USDC,
    exchangeRate: 0.082 // Default rate - will be updated with actual rate
  }
]
