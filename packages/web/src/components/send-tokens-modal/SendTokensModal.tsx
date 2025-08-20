import { useState } from 'react'

import {
  useArtistCoin,
  transformArtistCoinToTokenInfo,
  useSendTokens
} from '@audius/common/api'
import { AUDIO, FixedDecimal } from '@audius/fixed-decimal'

import ResponsiveModal from 'components/modal/ResponsiveModal'

import SendTokensConfirmation from './SendTokensConfirmation'
import SendTokensFailure from './SendTokensFailure'
import SendTokensInput from './SendTokensInput'
import SendTokensProgress from './SendTokensProgress'
import SendTokensSuccess from './SendTokensSuccess'
import { SendTokensModalProps, SendTokensState } from './types'

const SendTokensModal = ({
  mint,
  onClose,
  walletAddress,
  isOpen
}: SendTokensModalProps) => {
  const [state, setState] = useState<SendTokensState>({
    step: 'input',
    amount: BigInt(0),
    destinationAddress: ''
  })
  const [error, setError] = useState<string>('')

  // Get token data and balance using the same hooks as ReceiveTokensModal
  const { data: coin } = useArtistCoin({ mint })
  const tokenInfo = coin ? transformArtistCoinToTokenInfo(coin) : undefined

  // Use the new tan-query hook for sending tokens
  const sendTokensMutation = useSendTokens({ mint })

  const handleInputContinue = (amount: bigint, destinationAddress: string) => {
    setState({
      step: 'confirm',
      amount,
      destinationAddress
    })
  }

  const handleConfirm = async () => {
    setState((prev) => ({ ...prev, step: 'progress' }))
    setError('') // Clear any previous errors

    try {
      // Use the new hook to send tokens
      await sendTokensMutation.mutateAsync({
        recipientWallet: state.destinationAddress as any, // Type assertion for now
        amount: AUDIO(state.amount).value // Convert bigint to AudioWei
      })

      // If successful, move to success step
      setState((prev) => ({ ...prev, step: 'success' }))
    } catch (error) {
      // If there's an error, move to failure step
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorMessage)
      setState((prev) => ({ ...prev, step: 'failure' }))
    }
  }

  const handleBack = () => {
    setState((prev) => ({ ...prev, step: 'input' }))
  }

  const handleTryAgain = () => {
    setState((prev) => ({ ...prev, step: 'confirm' }))
    setError('')
  }

  const handleDone = () => {
    onClose()
    setState({
      step: 'input',
      amount: BigInt(0),
      destinationAddress: ''
    })
    setError('')
  }

  const handleClose = () => {
    if (state.step === 'input') {
      onClose()
      setState({
        step: 'input',
        amount: BigInt(0),
        destinationAddress: ''
      })
      setError('')
    }
  }

  const getModalTitle = () => {
    if (!tokenInfo) return 'Send Tokens'

    switch (state.step) {
      case 'input':
        return `Send ${tokenInfo.symbol}`
      case 'confirm':
        return 'Confirm Send'
      case 'progress':
        return 'Sending...'
      case 'success':
        return 'Sent Successfully'
      case 'failure':
        return 'Send Failed'
      default:
        return `Send ${tokenInfo.symbol}`
    }
  }

  if (!isOpen) return null

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size='m'
      dismissOnClickOutside={state.step === 'input'}
      showDismissButton={state.step === 'input'}
    >
      {state.step === 'input' && (
        <SendTokensInput
          mint={mint}
          onContinue={handleInputContinue}
          onClose={handleClose}
          initialAmount={
            state.amount > 0
              ? new FixedDecimal(state.amount, tokenInfo?.decimals).toString()
              : ''
          }
          initialDestinationAddress={state.destinationAddress}
        />
      )}

      {state.step === 'confirm' && (
        <SendTokensConfirmation
          mint={mint}
          amount={state.amount}
          destinationAddress={state.destinationAddress}
          onConfirm={handleConfirm}
          onBack={handleBack}
          onClose={handleClose}
        />
      )}

      {state.step === 'progress' && <SendTokensProgress />}

      {state.step === 'success' && (
        <SendTokensSuccess
          mint={mint}
          amount={state.amount}
          destinationAddress={state.destinationAddress}
          onDone={handleDone}
          onClose={handleClose}
        />
      )}

      {state.step === 'failure' && (
        <SendTokensFailure
          mint={mint}
          amount={state.amount}
          destinationAddress={state.destinationAddress}
          error={error}
          onTryAgain={handleTryAgain}
          onClose={handleClose}
        />
      )}
    </ResponsiveModal>
  )
}

export default SendTokensModal
