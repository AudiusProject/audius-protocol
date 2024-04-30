import { USDC, wAUDIO } from '@audius/fixed-decimal'

import { Mint } from './types'

export const toMintAmount = (amount: number | bigint, mint: Mint) => {
  switch (mint) {
    case 'USDC':
      return USDC(amount)
    case 'wAUDIO':
      return wAUDIO(amount)
  }
}
