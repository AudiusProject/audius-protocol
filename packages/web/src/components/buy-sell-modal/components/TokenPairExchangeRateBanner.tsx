import { Flex, Text } from '@audius/harmony'

const messages = {
  rate: 'Rate',
  exchangeRateText: (
    inputToken: { balanceLocaleString: string; ticker: string },
    outputToken: { balanceLocaleString: string; ticker: string }
  ) =>
    `$${inputToken.balanceLocaleString} ${inputToken.ticker} ≈ $${outputToken.balanceLocaleString} ${outputToken.ticker}`
}

export const TokenPairExchangeRateBanner = () => {
  return (
    <Flex justifyContent='flex-start'>
      <Text variant='body' size='s' color='subdued'>
        {messages.rate}&nbsp;
      </Text>
      <Text variant='body' size='s' color='default'>
        {messages.exchangeRateText(
          {
            balanceLocaleString: '1',
            ticker: '$USDC'
          },
          {
            balanceLocaleString: '100',
            ticker: '$AUDIO'
          }
        )}
      </Text>
    </Flex>
  )
}
