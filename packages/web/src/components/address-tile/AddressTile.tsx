import { useCallback, useContext } from 'react'

import { useUSDCBalance } from '@audius/common/hooks'
import { shortenSPLAddress } from '@audius/common/utils'
import { USDC } from '@audius/fixed-decimal'
import {
  Text,
  IconCopy,
  PlainButton,
  IconComponent,
  Flex,
  Box,
  useTheme
} from '@audius/harmony'
import { BN } from 'bn.js'

import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { copyToClipboard } from 'utils/clipboardUtil'

const messages = {
  usdcBalance: 'USDC Balance',
  copied: 'Copied to Clipboard!'
}

type AddressTileProps = {
  address: string
  iconLeft: IconComponent
  iconRight?: IconComponent
}

export const AddressTile = ({
  address,
  iconLeft: IconLeft,
  iconRight: IconRight
}: AddressTileProps) => {
  const { color } = useTheme()
  const { toast } = useContext(ToastContext)
  const isMobile = useIsMobile()
  const { data: balanceBN } = useUSDCBalance({
    isPolling: true,
    commitment: 'confirmed'
  })
  const handleCopyPress = useCallback(() => {
    copyToClipboard(address)
    toast(messages.copied)
  }, [address, toast])

  const defaultRight = (
    <PlainButton onClick={handleCopyPress}>
      <IconCopy size='s' color='subdued' />
    </PlainButton>
  )

  return (
    <Flex direction='column' border='default' borderRadius='s'>
      <Flex p='l' alignItems='center' justifyContent='space-between'>
        <Flex alignItems='center'>
          <IconLeft />
          <Box pl='s'>
            <Text variant='title' size='m'>
              {messages.usdcBalance}
            </Text>
          </Box>
        </Flex>
        <Text variant='title' size='l' strength='strong'>
          {USDC(balanceBN ?? new BN(0)).toLocaleString()}
        </Text>
      </Flex>
      <Flex
        css={{ backgroundColor: color.background.surface1 }}
        alignItems='stretch'
        justifyContent='space-between'
        borderTop='default'
        borderBottomLeftRadius='s'
        borderBottomRightRadius='s'
      >
        <Box p='l' borderRadius='s'>
          <Text
            css={{
              userSelect: 'text',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '125%'
            }}
            variant='body'
          >
            {isMobile ? shortenSPLAddress(address, 12) : address}
          </Text>
        </Box>
        <Flex alignItems='center' borderLeft='default' pr='l' pl='l'>
          {IconRight ? <IconRight /> : defaultRight}
        </Flex>
      </Flex>
    </Flex>
  )
}
