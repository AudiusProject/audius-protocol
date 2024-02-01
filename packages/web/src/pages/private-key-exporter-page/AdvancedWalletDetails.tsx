import { useCallback, useContext, useEffect, useState } from 'react'

import { Nullable, shortenSPLAddress } from '@audius/common'
import { Flex, Box, Divider, IconCopy, Text, useTheme } from '@audius/harmony'
import pkg from 'bs58'

import { ToastContext } from 'components/toast/ToastContext'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './PrivateKeyExporterPage.module.css'

const messages = {
  advancedWalletDetails: 'Advanced Wallet Details',
  address: 'ADDRESS',
  privateKey: 'PRIVATE KEY',
  copied: 'Copied to Clipboard!'
}

type KeyProps = {
  label: string
  value: string
  shorten?: boolean
}

const Key = ({ label, value, shorten }: KeyProps) => {
  const { color } = useTheme()
  const { toast } = useContext(ToastContext)
  const handleClick = useCallback(() => {
    copyToClipboard(value)
    toast(messages.copied)
  }, [value, toast])
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
          {shorten ? shortenSPLAddress(value, 21) : value}
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
      <Key label={messages.privateKey} value={encodedPrivateKey} shorten />
    </Flex>
  )
}
