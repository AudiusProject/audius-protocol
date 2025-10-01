import type { TokenInfo } from '@audius/common/store'

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
  if (tokenInfo.symbol === 'USDC') {
    return (
      <USDCBalanceSection title={title} tokenInfo={tokenInfo} amount={amount} />
    )
  }
  return (
    <CryptoBalanceSection
      title={title}
      tokenInfo={tokenInfo}
      name={tokenInfo.name}
      amount={amount}
      priceLabel={priceLabel}
    />
  )
}
