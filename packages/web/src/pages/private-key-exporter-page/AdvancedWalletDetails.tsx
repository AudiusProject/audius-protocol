import { useCallback, useContext, useEffect, useState } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Nullable, shortenSPLAddress } from '@audius/common/utils'
import { Flex, Box, Divider, IconCopy, Text, useTheme } from '@audius/harmony'
import pkg from 'bs58'

import { make, useRecord } from 'common/store/analytics/actions'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { copyToClipboard } from 'utils/clipboardUtil'
import { useSelector } from 'utils/reducer'

const { getUserHandle, getUserId } = accountSelectors

const messages = {
  advancedWalletDetails: 'Advanced Wallet Details',
  address: 'ADDRESS',
  privateKey: 'PRIVATE KEY',
  copied: 'Copied to Clipboard!'
}

type KeyProps = {
  label: string
  value: string
  isPrivate?: boolean
}

const Key = ({ label, value, isPrivate }: KeyProps) => {
  const { color } = useTheme()
  const { toast } = useContext(ToastContext)
  const record = useRecord()
  const isMobile = useIsMobile()
  const accountHandle = useSelector(getUserHandle)
  const accountUserId = useSelector(getUserId)
  const handleClick = useCallback(() => {
    copyToClipboard(value)
    if (accountHandle && accountUserId) {
      if (isPrivate) {
        record(
          make(Name.EXPORT_PRIVATE_KEY_PRIVATE_KEY_COPIED, {
            handle: accountHandle,
            userId: accountUserId
          })
        )
      } else {
        record(
          make(Name.EXPORT_PRIVATE_KEY_PUBLIC_ADDRESS_COPIED, {
            handle: accountHandle,
            userId: accountUserId
          })
        )
      }
    }
    toast(messages.copied)
  }, [value, accountHandle, accountUserId, isPrivate, record, toast])
  return (
    <Flex
      border='strong'
      borderRadius='m'
      backgroundColor='surface1'
      css={{ borderWidth: 1, cursor: 'pointer' }}
      onClick={handleClick}
    >
      <Flex justifyContent='center' alignItems='center' css={{ width: 150 }}>
        <Text variant='title' css={{ color: color.neutral.n600 }}>
          {label}
        </Text>
      </Flex>
      <Divider orientation='vertical' />
      <Box p='xl' css={isMobile ? {} : { width: 464 }}>
        <Text variant='body'>
          {isPrivate
            ? shortenSPLAddress(value, isMobile ? 4 : 18)
            : isMobile
            ? shortenSPLAddress(value, 4)
            : value}
        </Text>
      </Box>
      <Divider orientation='vertical' />
      <Box p='xl' css={{ width: 64 }}>
        <IconCopy width={16} height={16} color='default' />
      </Box>
    </Flex>
  )
}

export const AdvancedWalletDetails = () => {
  const [publicKey, setPublicKey] = useState<Nullable<string>>(null)
  const [encodedPrivateKey, setEncodedPrivateKey] =
    useState<Nullable<string>>(null)
  const { solanaWalletService } = useAudiusQueryContext()

  useEffect(() => {
    const fetchKeypair = async () => {
      const keypair = await solanaWalletService.getKeypair()
      if (keypair) {
        setPublicKey(keypair.publicKey.toString())
        setEncodedPrivateKey(pkg.encode(keypair.secretKey))
      }
    }
    fetchKeypair()
  }, [solanaWalletService])

  if (!publicKey || !encodedPrivateKey) {
    return null
  }

  return (
    <Flex direction='column' gap='l' pv='xl'>
      <Text variant='heading' size='s'>
        {messages.advancedWalletDetails}
      </Text>
      <Key label={messages.address} value={publicKey} />
      <Key label={messages.privateKey} value={encodedPrivateKey} isPrivate />
    </Flex>
  )
}
