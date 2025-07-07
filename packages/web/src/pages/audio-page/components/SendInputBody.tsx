import { ChangeEvent, useCallback, useMemo, useState } from 'react'

import {
  Chain,
  StringAudio,
  WalletAddress,
  SolanaWalletAddress
} from '@audius/common/models'
import { IntKeys, MIN_TRANSFERRABLE_WEI } from '@audius/common/services'
import { isValidSolAddress } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import {
  Button,
  Flex,
  IconTokenGold as IconGoldBadgeSVG,
  IconValidationX,
  TextInput,
  TokenAmountInput
} from '@audius/harmony'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DashboardTokenValueSlider from './DashboardTokenValueSlider'
import styles from './SendInputBody.module.css'

const { getRemoteVar } = remoteConfigInstance

const messages = {
  warningTitle: 'PROCEED WITH CAUTION',
  warningSubtitle: 'If you send $AUDIO to the wrong address it will be lost.',
  warningSubtitle2:
    'WARNING: $AUDIO sent will not count towards badges, tiers, and unlocked features!',
  addressSolPlaceholder: '9qU2A32k4bL6sbohrah2MiZZRfemH92hyZTY7jKc5GR8',
  sendAudio: 'SEND $AUDIO',
  insufficientBalance: 'Account does not have enough $AUDIO',
  amountRequired: 'Amount is a required field',
  amountInsufficient: 'This amount of $AUDIO is too low to send.',
  amountMalformed: 'Amount must be a valid number',
  addressMalformed: 'Please enter a valid address',
  addressRequired: 'Address is required',
  addressIsSelf: 'You cannot send $AUDIO to your own wallet!',
  validSPLAddress: 'Please enter a valid Solana (SPL) wallet address',
  sendAmountLabel: 'Amount to send',
  destinationSPL: 'Destination Address (Solana SPL)'
}

type BalanceError =
  | 'INSUFFICIENT_BALANCE'
  | 'INSUFFICIENT_TRANSFER_AMOUNT'
  | 'EMPTY'
  | 'MALFORMED'
  | 'LESS_THAN_MIN'

type AddressError =
  | 'MALFORMED'
  | 'EMPTY'
  | 'SEND_TO_SELF'
  | 'INVALID_SPL_ADDRESS'

const makeMinAudioError = (num: number | string) =>
  `You must send at least ${num} $AUDIO`

const balanceErrorMap: { [B in BalanceError]: string } = {
  INSUFFICIENT_BALANCE: messages.insufficientBalance,
  EMPTY: messages.amountRequired,
  MALFORMED: messages.amountMalformed,
  INSUFFICIENT_TRANSFER_AMOUNT: messages.amountInsufficient,
  LESS_THAN_MIN: 'LESS_THAN_MIN' // special case this key to create on the fly
}

const addressErrorMap: { [A in AddressError]: string } = {
  MALFORMED: messages.addressMalformed,
  EMPTY: messages.addressRequired,
  SEND_TO_SELF: messages.addressIsSelf,
  INVALID_SPL_ADDRESS: messages.validSPLAddress
}

type SendInputBodyProps = {
  currentBalance: AudioWei
  onSend: (
    balance: AudioWei,
    destinationAddress: WalletAddress,
    chain: Chain
  ) => void
  wallet: WalletAddress
  solWallet: WalletAddress
}

const validateSolWallet = (
  wallet: Nullable<SolanaWalletAddress>,
  ownSolWallet: WalletAddress
): Nullable<AddressError> => {
  if (!wallet) return 'EMPTY'
  if (!isValidSolAddress(wallet)) return 'INVALID_SPL_ADDRESS'
  if (wallet.toLowerCase() === ownSolWallet.toLowerCase()) {
    return 'SEND_TO_SELF'
  }
  return null
}

const validateSendAmount = (
  stringAudioAmount: StringAudio,
  balanceWei: AudioWei,
  minAudioSendAmount: number
): Nullable<BalanceError> => {
  if (!stringAudioAmount.length) return 'EMPTY'

  let sendWeiAmount: AudioWei
  try {
    sendWeiAmount = AUDIO(stringAudioAmount).value
  } catch {
    return 'MALFORMED'
  }

  const minWeiAmount = AUDIO(minAudioSendAmount.toString()).value
  if (sendWeiAmount < minWeiAmount) return 'LESS_THAN_MIN'
  if (sendWeiAmount > balanceWei) return 'INSUFFICIENT_BALANCE'
  if (sendWeiAmount < MIN_TRANSFERRABLE_WEI)
    return 'INSUFFICIENT_TRANSFER_AMOUNT'

  return null
}

const ErrorLabel = ({ text }: { text: string }) => {
  return (
    <div className={styles.errorLabel}>
      <IconValidationX /> {text}
    </div>
  )
}

const SendInputBody = ({
  currentBalance,
  onSend,
  wallet,
  solWallet
}: SendInputBodyProps) => {
  const [amountToSend, setAmountToSend] = useState<StringAudio>(
    '' as StringAudio
  )
  const amountToSendWei: AudioWei = useMemo(() => {
    if (!amountToSend.length) return BigInt(0) as AudioWei
    try {
      return AUDIO(amountToSend).value
    } catch {
      return BigInt(0) as AudioWei
    }
  }, [amountToSend])
  const [destinationAddress, setDestinationAddress] = useState('')

  const [min, max] = useMemo(() => {
    const min = AUDIO('0').value
    const max = currentBalance
    return [min, max]
  }, [currentBalance])

  const [balanceError, setBalanceError] = useState<Nullable<BalanceError>>(null)
  const [addressError, setAddressError] = useState<Nullable<AddressError>>(null)
  const hasError = balanceError || addressError

  const handleChangeAmount = useCallback(
    (value: string) => {
      setAmountToSend(value as StringAudio)
      if (balanceError) setBalanceError(null)
    },
    [balanceError, setBalanceError, setAmountToSend]
  )

  const handleChangeAddress = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setDestinationAddress(e.target.value)
      if (addressError) setAddressError(null)
    },
    [addressError, setAddressError, setDestinationAddress]
  )

  const minAudioSendAmount = getRemoteVar(
    IntKeys.MIN_AUDIO_SEND_AMOUNT
  ) as number

  const onClickSend = () => {
    const balanceError = validateSendAmount(
      amountToSend,
      currentBalance,
      minAudioSendAmount
    )
    let walletError: Nullable<AddressError> = null
    walletError = validateSolWallet(
      destinationAddress as SolanaWalletAddress,
      solWallet
    )
    setBalanceError(balanceError)
    setAddressError(walletError)
    if (balanceError || walletError) return
    onSend(amountToSendWei, destinationAddress, Chain.Sol)
  }

  const renderBalanceError = () => {
    if (!balanceError) return null
    const errorMsg =
      balanceError === 'LESS_THAN_MIN'
        ? makeMinAudioError(minAudioSendAmount)
        : balanceErrorMap[balanceError]
    return <ErrorLabel text={errorMsg} />
  }

  const renderAddressError = () => {
    if (!addressError) return null
    return <ErrorLabel text={addressErrorMap[addressError]} />
  }

  return (
    <ModalBodyWrapper>
      <Flex direction='column' gap='xl' pv='xl' alignItems='center'>
        <div>
          <ModalBodyTitle text={messages.warningTitle} />
          <div className={styles.subtitle}>{messages.warningSubtitle}</div>
          <div className={styles.subtitle2}>
            {messages.warningSubtitle2} <IconGoldBadgeSVG />
          </div>
        </div>
        <DashboardTokenValueSlider
          min={min}
          max={max}
          value={amountToSendWei}
        />
        <TokenAmountInput
          label={messages.sendAmountLabel}
          placeholder='0'
          value={amountToSend}
          onChange={handleChangeAmount}
          tokenLabel='$AUDIO'
        />
        {renderBalanceError()}
        <TextInput
          label={messages.destinationSPL}
          placeholder={messages.addressSolPlaceholder}
          value={destinationAddress}
          onChange={handleChangeAddress}
        />
        {renderAddressError()}
        <Button variant='primary' onClick={onClickSend} disabled={!!hasError}>
          {messages.sendAudio}
        </Button>
      </Flex>
    </ModalBodyWrapper>
  )
}

export default SendInputBody
