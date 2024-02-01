import { useCallback, useContext, useEffect, useState } from 'react'

import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Nullable, shortenSPLAddress } from '@audius/common/utils'
import { Flex, Box, Divider, IconCopy, Text, useTheme } from '@audius/harmony'
import pkg from 'bs58'

import { make, useRecord } from 'common/store/analytics/actions'
import { ToastContext } from 'components/toast/ToastContext'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
import { copyToClipboard } from 'utils/clipboardUtil'
import { useSelector } from 'utils/reducer'

import styles from './PrivateKeyExporterPage.module.css'

const getAccountUser = accountSelectors.getAccountUser

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
  const user = useSelector(getAccountUser) ?? undefined
  const handleClick = useCallback(() => {
    copyToClipboard(value)
    if (user) {
      if (isPrivate) {
        record(
          make(Name.EXPORT_PRIVATE_KEY_PRIVATE_KEY_COPIED, {
            handle: user.handle,
            userId: user.user_id
          })
        )
      } else {
        record(
          make(Name.EXPORT_PRIVATE_KEY_PUBLIC_ADDRESS_COPIED, {
            handle: user.handle,
            userId: user.user_id
          })
        )
      }
    }
    toast(messages.copied)
  }, [value, isPrivate, toast])
  return (
    <Flex
      border='strong'
      css={{ borderWidth: 1, cursor: 'pointer' }}
      onClick={handleClick}
    >
      <Flex justifyContent='center' alignItems='center' css={{ width: 150 }}>
        <Text variant='title' css={{ color: color.neutral.n600 }}>
          {label}
        </Text>
      </Flex>
      <Divider orientation='vertical' />
      <Box p='xl' css={{ width: 464 }}>
        <Text variant='body'>
          {isPrivate ? shortenSPLAddress(value, 21) : value}
        </Text>
      </Box>
      <Divider orientation='vertical' />
      <Box p='xl' css={{ width: 64 }}>
        <IconCopy width={16} height={16} className={styles.copyIcon} />
      </Box>
    </Flex>
  )
}

export const AdvancedWalletDetails = () => {
  const [publicKey, setPublicKey] = useState<Nullable<string>>(null)
  const [encodedPrivateKey, setEncodedPrivateKey] =
    useState<Nullable<string>>(null)

  useEffect(() => {
    const fetchKeypair = async () => {
      await waitForLibsInit()
      const libs = window.audiusLibs
      const privateKey = libs.Account?.hedgehog?.wallet?.getPrivateKey()
      if (privateKey) {
        const keypair =
          libs.solanaWeb3Manager?.solanaWeb3?.Keypair?.fromSeed(privateKey)
        if (keypair) {
          setPublicKey(keypair.publicKey.toString())
          setEncodedPrivateKey(pkg.encode(keypair.secretKey))
        }
      }
    }
    fetchKeypair()
  }, [])

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
