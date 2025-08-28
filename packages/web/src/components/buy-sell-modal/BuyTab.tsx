import { useTokenBalance } from '@audius/common/api'
import {
  Button,
  Flex,
  IconInfo,
  IconLogoCircleUSDCPng,
  Skeleton,
  Text,
  TextInput
} from '@audius/harmony'

import { Tooltip } from 'components/tooltip'
import { env } from 'services/env'

import { ArtistTokenDropdown } from './components/ArtistTokenDropdown'
import { TokenPairExchangeRateBanner } from './components/TokenPairExchangeRateBanner'

const messages = {
  youPay: 'You Pay',
  youReceive: 'You Receive',
  available: ' available',
  infoTooltipText:
    'This is the amount of USDC you have available to spend. You can add more USDC to your wallet in the wallet tab.',
  max: 'MAX'
}

export const BuyTab = () => {
  const { data: usdcBalance, isPending: isUSDCBalancePending } =
    useTokenBalance({ mint: env.USDC_MINT_ADDRESS })
  const { balanceLocaleString } = usdcBalance ?? {}
  const currentOutputToken = '$AUDIO'

  return (
    <Flex gap='xl' w='100%' direction='column'>
      <Flex direction='column' gap='s' w='100%'>
        <Flex gap='s' justifyContent='space-between' w='100%'>
          <Text variant='title' size='l'>
            {messages.youPay}
          </Text>
          <Flex gap='xs' alignItems='center'>
            <IconLogoCircleUSDCPng hex />
            <Text variant='body' size='m' strength='strong' textAlign='center'>
              $
              {isUSDCBalancePending ? (
                <Skeleton
                  w='50px'
                  h='16px'
                  css={{ display: 'inline-block', marginRight: '4px' }}
                />
              ) : (
                balanceLocaleString
              )}
              {messages.available}
            </Text>
            <Tooltip text={messages.infoTooltipText}>
              <IconInfo color='subdued' size='m' css={{ cursor: 'pointer' }} />
            </Tooltip>
          </Flex>
        </Flex>
        <Flex gap='s' h='100%'>
          <TextInput
            endAdornmentText='USD'
            label='Amount of USDC you pay'
            placeholder='0.00'
            width='100%'
            hideLabel
          />
          <Button variant='secondary' css={{ height: '100%' }}>
            {messages.max}
          </Button>
        </Flex>
      </Flex>
      <Flex direction='column' gap='s' w='100%'>
        <Flex gap='s' justifyContent='space-between' w='100%'>
          <Text variant='title' size='l'>
            {messages.youReceive}
          </Text>
        </Flex>
        <Flex gap='s'>
          <TextInput
            endAdornmentText={currentOutputToken}
            label='Amount of AUDIO you receive'
            placeholder='0.00'
            width='100%'
            hideLabel
          />
        </Flex>
      </Flex>
      <TokenPairExchangeRateBanner />
    </Flex>
  )
}
