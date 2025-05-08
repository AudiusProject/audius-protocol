import { useState } from 'react'

import {
  Button,
  Flex,
  IconMessage,
  Paper,
  Text,
  TextInput,
  makeResponsiveStyles
} from '@audius/harmony'
import { Secp256k1Program, ClaimableTokensProgram } from '@audius/spl'

import { messages } from '../messages'

const useSignatureDecoderStyles = makeResponsiveStyles(({ theme }) => ({
  root: {
    mobile: {
      width: '100%',
      minWidth: '300px'
    },
    base: {
      width: `calc(50% - ${theme.spacing.xl / 2}px)`
    }
  }
}))

export const SignatureDecoder = () => {
  const [signatureInput, setSignatureInput] = useState('')
  const [decodedSignatureMessage, setDecodedSignatureMessage] = useState('')
  const [signatureDecodeError, setSignatureDecodeError] = useState('')
  const styles = useSignatureDecoderStyles()

  const handleDecodeSignature = () => {
    setDecodedSignatureMessage('')
    setSignatureDecodeError('')
    if (!signatureInput.trim()) {
      setSignatureDecodeError('Input cannot be empty.')
      return
    }

    try {
      let hex = signatureInput.trim()
      if (hex.startsWith('0x')) {
        hex = hex.substring(2)
      }

      if (hex.length === 0 || hex.length % 2 !== 0) {
        setSignatureDecodeError(
          'Hex string must have an even number of characters and cannot be empty after removing "0x".'
        )
        return
      }
      if (!/^[0-9a-fA-F]+$/.test(hex)) {
        setSignatureDecodeError(
          'Invalid characters in hex string. Only 0-9 and a-f are allowed.'
        )
        return
      }

      const instructionData = Uint8Array.from(Buffer.from(hex, 'hex'))

      const decodedSecpData = Secp256k1Program.decode(instructionData)

      const decodedMessagePayload =
        ClaimableTokensProgram.layouts.signedTransferInstructionData.decode(
          Uint8Array.from(decodedSecpData.message)
        )

      setDecodedSignatureMessage(
        JSON.stringify(
          decodedMessagePayload,
          (key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          2
        )
      )
    } catch (error: any) {
      console.error('Signature decode error:', error)
      setSignatureDecodeError(
        `Failed to decode: ${error.message || 'Unknown error'}`
      )
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
        <IconMessage size='l' color='default' />
        <Text variant='title' size='l'>
          {messages.signatureDecoderTitle}
        </Text>
      </Flex>
      <Text variant='body'>{messages.signatureDecoderDescription}</Text>
      <Text variant='label' size='s'>
        {messages.signatureDecoderInputLabel}
      </Text>
      <TextInput
        label={messages.signatureDecoderInputLabel}
        hideLabel
        placeholder='Enter Secp256k1 instruction hex string (single line for now)...'
        value={signatureInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSignatureInput(e.target.value)
        }
        width='100%'
      />
      <Button variant='secondary' fullWidth onClick={handleDecodeSignature}>
        {messages.signatureDecoderButton}
      </Button>
      {decodedSignatureMessage && (
        <Flex direction='column' gap='s' css={{ width: '100%' }}>
          <Text variant='label' size='s'>
            {messages.signatureDecoderOutputLabel}
          </Text>
          <Paper as='pre' p='s' w='100%' backgroundColor='default'>
            <Text variant='body' size='s'>
              {decodedSignatureMessage}
            </Text>
          </Paper>
        </Flex>
      )}
      {signatureDecodeError && (
        <Flex direction='column' gap='s' css={{ width: '100%' }}>
          <Text variant='label' size='s' color='danger'>
            {messages.signatureDecoderErrorLabel}
          </Text>
          <Text variant='body' color='danger'>
            {signatureDecodeError}
          </Text>
        </Flex>
      )}
    </Paper>
  )
}
