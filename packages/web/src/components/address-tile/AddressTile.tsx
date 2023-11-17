import { useCallback, useContext } from 'react'

import {
  BNUSDC,
  decimalIntegerToHumanReadable,
  formatUSDCWeiToCeilingCentsNumber,
  shortenSPLAddress,
  useUSDCBalance
} from '@audius/common'
import {
  Text,
  IconCopy,
  PlainButton,
  IconComponent,
  Flex,
  Box
} from '@audius/harmony'
import { BN } from 'bn.js'

import { ToastContext } from 'components/toast/ToastContext'
import { isMobile } from 'utils/clientUtil'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './AddressTile.module.css'

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
  const { toast } = useContext(ToastContext)
  const mobile = isMobile()

  const { data: balance } = useUSDCBalance()
  const balanceNumber = formatUSDCWeiToCeilingCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

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
          {`$${balanceFormatted}`}
        </Text>
      </Flex>
      <Flex
        css={{ backgroundColor: 'var(--background-surface-1)' }}
        alignItems='stretch'
        justifyContent='space-between'
        borderTop='default'
        borderBottomLeftRadius='s'
        borderBottomRightRadius='s'
      >
        <Box p='l' borderRadius='s'>
          <Text
            css={{ userSelect: 'text' }}
            variant='body'
            className={styles.address}
          >
            {mobile ? shortenSPLAddress(address, 20) : address}
          </Text>
        </Box>
        <Flex alignItems='center' borderLeft='default' pr='l' pl='l'>
          {IconRight ? <IconRight /> : defaultRight}
        </Flex>
      </Flex>
    </Flex>
  )
}
