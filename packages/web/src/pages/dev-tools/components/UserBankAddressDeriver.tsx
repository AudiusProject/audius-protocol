import { useState } from 'react'

import { TOKEN_LISTING_MAP } from '@audius/common/store'
import {
  Button,
  Flex,
  IconKey,
  Paper,
  Text,
  TextInput,
  Select
} from '@audius/harmony'
import { ClaimableTokensProgram } from '@audius/spl'
import { PublicKey } from '@solana/web3.js'

import { useDevToolCardStyles } from '../DevTools'
import { messages } from '../messages'

const supportedTokens = ['AUDIO', 'USDC'] as const
type SupportedToken = (typeof supportedTokens)[number]

export const UserBankAddressDeriver = () => {
  const [ethAddress, setEthAddress] = useState('')
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('AUDIO')
  const [derivedAddress, setDerivedAddress] = useState('')
  const [error, setError] = useState('')
  const styles = useDevToolCardStyles()

  const handleDeriveAddress = async () => {
    setDerivedAddress('')
    setError('')

    if (!ethAddress.trim()) {
      setError('Ethereum address cannot be empty.')
      return
    }
    if (!ethAddress.startsWith('0x') || ethAddress.length !== 42) {
      setError('Invalid Ethereum address format.')
      return
    }

    try {
      const mintInfo = TOKEN_LISTING_MAP[selectedToken]
      if (!mintInfo) {
        setError(`Token information not found for ${selectedToken}`)
        return
      }

      const mintPk = new PublicKey(mintInfo.address)
      const programIdPk = ClaimableTokensProgram.programId

      const authorityPDA = await ClaimableTokensProgram.deriveAuthority({
        programId: programIdPk,
        mint: mintPk
      })

      const userBankAddress = await ClaimableTokensProgram.deriveUserBank({
        ethAddress,
        claimableTokensPDA: authorityPDA
      })

      setDerivedAddress(userBankAddress.toBase58())
    } catch (e: any) {
      console.error('Error deriving user bank address:', e)
      setError(e.message || 'An unknown error occurred.')
    }
  }

  return (
    <Paper
      direction='column'
      alignItems='flex-start'
      gap='l'
      p='l'
      css={styles.root}
    >
      <Flex alignItems='center' gap='m'>
        <IconKey size='l' color='default' />
        <Text variant='title' size='l'>
          {messages.userBankDeriverTitle}
        </Text>
      </Flex>
      <Text variant='body'>{messages.userBankDeriverDescription}</Text>

      <Text variant='label' size='s'>
        {messages.userBankDeriverEthAddressLabel}
      </Text>
      <TextInput
        label={messages.userBankDeriverEthAddressLabel}
        hideLabel
        placeholder={messages.userBankDeriverEthAddressPlaceholder}
        value={ethAddress}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEthAddress(e.target.value)
        }
        width='100%'
      />

      <Text variant='label' size='s'>
        {messages.userBankDeriverTokenLabel}
      </Text>
      <Select
        label={messages.userBankDeriverTokenLabel}
        hideLabel
        value={selectedToken}
        onChange={(value: string) => setSelectedToken(value as SupportedToken)}
        aria-label={messages.userBankDeriverTokenLabel}
        options={supportedTokens.map((token) => ({
          value: token,
          label: token
        }))}
        width='100%'
      />

      <Button variant='secondary' fullWidth onClick={handleDeriveAddress}>
        {messages.userBankDeriverButton}
      </Button>

      {derivedAddress && (
        <Flex direction='column' gap='s' css={{ width: '100%' }}>
          <Text variant='label' size='s'>
            {messages.userBankDeriverOutputLabel}
          </Text>
          <Paper as='pre' p='s' w='100%' backgroundColor='default'>
            <Text variant='body' size='s'>
              {derivedAddress}
            </Text>
          </Paper>
        </Flex>
      )}

      {error && (
        <Flex direction='column' gap='s' css={{ width: '100%' }}>
          <Text variant='label' size='s' color='danger'>
            {messages.userBankDeriverErrorLabel}
          </Text>
          <Text variant='body' color='danger'>
            {error}
          </Text>
        </Flex>
      )}
    </Paper>
  )
}
