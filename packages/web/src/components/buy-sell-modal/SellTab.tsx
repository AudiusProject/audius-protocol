import { useCallback, useState } from 'react'

import { Flex } from '@audius/harmony'

import { TokenAmountSection } from './TokenAmountSection'
import { TokenPair } from './types'

type SellTabProps = {
  tokenPair: TokenPair
}

export const SellTab = ({ tokenPair }: SellTabProps) => {
  const { baseToken, quoteToken, exchangeRate } = tokenPair
  const [baseAmount, setBaseAmount] = useState<string>('')
  const receivedQuoteAmount = parseFloat(baseAmount || '0') * exchangeRate || 0

  const handleBaseAmountChange = useCallback((value: string) => {
    // Allow only valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBaseAmount(value)
    }
  }, [])

  const handleMaxClick = useCallback(() => {
    setBaseAmount(baseToken.balance.toString())
  }, [baseToken.balance])

  return (
    <Flex direction='column' gap='l'>
      <TokenAmountSection
        title='You Pay'
        tokenInfo={baseToken}
        isInput={true}
        amount={parseFloat(baseAmount)}
        onAmountChange={handleBaseAmountChange}
        onMaxClick={handleMaxClick}
        availableBalance={baseToken.balance}
        placeholder='0.00'
      />

      <TokenAmountSection
        title='You Receive'
        tokenInfo={quoteToken}
        isInput={false}
        amount={receivedQuoteAmount}
        availableBalance={0}
        exchangeRate={exchangeRate}
      />
    </Flex>
  )
}
