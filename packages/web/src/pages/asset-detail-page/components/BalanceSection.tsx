import { ComponentType } from 'react'

import { useAudioBalance } from '@audius/common/api'
import { useFormattedAudioBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { Button, Flex, Paper, Text, useTheme } from '@audius/harmony'

import { ACCEPTED_ROUTES } from '../constants'
import { AssetDetailProps } from '../types'

type BalanceStateProps = {
  title: string
  icon?: ComponentType<any>
}

const TokenIcon = ({ icon: Icon }: { icon?: ComponentType<any> }) => {
  const { cornerRadius } = useTheme()
  if (!Icon) return null
  return <Icon size='4xl' css={{ borderRadius: cornerRadius.circle }} />
}

const ZeroBalanceState = ({ title, icon }: BalanceStateProps) => {
  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon icon={icon} />
        <Text variant='heading' size='l' color='subdued'>
          {title}
        </Text>
      </Flex>
      <Flex gap='s'>
        <Button variant='primary' fullWidth>
          {walletMessages.buy}
        </Button>
        <Button variant='secondary' fullWidth>
          {walletMessages.receive}
        </Button>
      </Flex>
    </>
  )
}

const HasBalanceState = ({ title, icon }: BalanceStateProps) => {
  const { motion } = useTheme()
  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon icon={icon} />
        <Flex
          direction='column'
          gap='xs'
          css={{
            opacity: isLoading ? 0 : 1,
            transition: `opacity ${motion.expressive}`
          }}
        >
          <Flex gap='xs'>
            <Text variant='heading' size='l' color='default'>
              {audioBalanceFormatted}
            </Text>
            <Text variant='heading' size='l' color='subdued'>
              {title}
            </Text>
          </Flex>
          <Text variant='heading' size='s' color='subdued'>
            {audioDollarValue}
          </Text>
        </Flex>
      </Flex>
      <Flex direction='column' gap='s'>
        <Button variant='secondary' fullWidth>
          {walletMessages.buySell}
        </Button>
        <Flex gap='s'>
          <Button variant='secondary' fullWidth>
            {walletMessages.send}
          </Button>
          <Button variant='secondary' fullWidth>
            {walletMessages.receive}
          </Button>
        </Flex>
      </Flex>
    </>
  )
}

export const BalanceSection = ({ slug }: AssetDetailProps) => {
  const { totalBalance } = useAudioBalance()
  const { title, icon } = ACCEPTED_ROUTES[slug]

  return (
    <Paper ph='xl' pv='l'>
      <Flex direction='column' gap='l' w='100%'>
        {!totalBalance ? (
          <ZeroBalanceState title={title} icon={icon} />
        ) : (
          <HasBalanceState title={title} icon={icon} />
        )}
      </Flex>
    </Paper>
  )
}
