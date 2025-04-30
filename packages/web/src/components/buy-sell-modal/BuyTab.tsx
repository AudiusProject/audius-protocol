import { useCallback, useState } from 'react'

import { Flex } from '@audius/harmony'

import { TokenAmountSection } from './TokenAmountSection'
import { TokenPair } from './types'

type BuyTabProps = {
  tokenPair: TokenPair
}

export const BuyTab = ({ tokenPair }: BuyTabProps) => {
  const { baseToken, quoteToken, exchangeRate } = tokenPair
  const [quoteAmount, setQuoteAmount] = useState<string>('')
  const receivedBaseAmount = parseFloat(quoteAmount || '0') / exchangeRate || 0

  const handleQuoteAmountChange = useCallback((value: string) => {
    // Allow only valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuoteAmount(value)
    }
  }, [])

  const handleMaxClick = useCallback(() => {
    setQuoteAmount(quoteToken.balance.toString())
  }, [quoteToken.balance])

  return (
    <Flex direction='column' gap='l'>
      <TokenAmountSection
        title='You Pay'
        tokenInfo={quoteToken}
        isInput={true}
        amount={parseFloat(quoteAmount)}
        onAmountChange={handleQuoteAmountChange}
        onMaxClick={handleMaxClick}
        availableBalance={quoteToken.balance}
        placeholder='0.00'
      />

      <TokenAmountSection
        title='You Receive'
        tokenInfo={baseToken}
        isInput={false}
        amount={receivedBaseAmount}
        availableBalance={0}
        exchangeRate={exchangeRate}
      />
    </Flex>
  )
}
