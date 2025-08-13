import { TokenInfo } from '@audius/common/store'

import { env } from 'services/env'

import { CryptoBalanceSection } from './CryptoBalanceSection'
import { USDCBalanceSection } from './USDCBalanceSection'

type SwapBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  priceLabel?: string
}

export const SwapBalanceSection = (props: SwapBalanceSectionProps) => {
  const { title, tokenInfo, amount, priceLabel } = props
  const isUsdc = tokenInfo.address === env.USDC_MINT_ADDRESS
  if (isUsdc) {
    return (
      <USDCBalanceSection
        title={title}
        tokenInfo={tokenInfo}
        amount={amount}
        tooltipPlacement='right'
      />
    )
  }
  return (
    <CryptoBalanceSection
      title={title}
      tokenInfo={tokenInfo}
      amount={amount}
      priceLabel={priceLabel}
    />
  )
}
