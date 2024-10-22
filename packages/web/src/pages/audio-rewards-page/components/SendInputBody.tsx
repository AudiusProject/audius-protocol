import { ChangeEvent, useCallback, useMemo, useState } from 'react'

import {
  Chain,
  StringWei,
  StringAudio,
  BNWei,
  BNAudio,
  WalletAddress,
  SolanaWalletAddress
} from '@audius/common/models'
import { IntKeys, MIN_TRANSFERRABLE_WEI } from '@audius/common/services'
import {
  weiToAudio,
  stringWeiToBN,
  stringAudioToBN,
  parseAudioInputToWei,
  Nullable
} from '@audius/common/utils'
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
  addressEthPlaceholder: '0xC7EF9651259197aA26544Af724441a46e491c12c',
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
  destination: 'Destination Address',
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
  currentBalance: BNWei
  onSend: (
    balance: BNWei,
    destinationAddress: WalletAddress,
    chain: Chain
  ) => void
  wallet: WalletAddress
  solWallet: WalletAddress
}

const isValidSolDestination = (wallet: SolanaWalletAddress) => {
  const solanaweb3 = window.audiusLibs.solanaWeb3Manager?.solanaWeb3
  if (!solanaweb3) {
    console.error('No solana web3 found')
    return false
  }
  try {
    const ignored = new solanaweb3.PublicKey(wallet)
    return true
  } catch (err) {
    console.info(err)
    return false
  }
}

const validateSolWallet = (
  wallet: Nullable<SolanaWalletAddress>,
  ownSolWallet: WalletAddress
): Nullable<AddressError> => {
  if (!wallet) return 'EMPTY'
  if (!isValidSolDestination(wallet)) return 'INVALID_SPL_ADDRESS'
  if (wallet.toLowerCase() === ownSolWallet.toLowerCase()) {
    return 'SEND_TO_SELF'
  }
  return null
}

const validateSendAmount = (
  stringAudioAmount: StringAudio,
  balanceWei: BNWei,
  minAudioSendAmount: number
): Nullable<BalanceError> => {
  if (!stringAudioAmount.length) return 'EMPTY'
  const sendWeiBN = parseAudioInputToWei(stringAudioAmount)
  const minWeiBN = parseAudioInputToWei(
    (minAudioSendAmount?.toString() as StringAudio) ?? ('0' as StringAudio)
  )
  if (!sendWeiBN) return 'MALFORMED'
  if (minWeiBN && sendWeiBN.lt(minWeiBN)) return 'LESS_THAN_MIN'
  if (sendWeiBN.gt(balanceWei)) return 'INSUFFICIENT_BALANCE'
  if (sendWeiBN.lt(MIN_TRANSFERRABLE_WEI)) return 'INSUFFICIENT_TRANSFER_AMOUNT'

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
  const amountToSendBNWei: BNWei = useMemo(() => {
    const zeroWei = stringWeiToBN('0' as StringWei)
    return parseAudioInputToWei(amountToSend) ?? zeroWei
  }, [amountToSend])
  const [destinationAddress, setDestinationAddress] = useState('')

  const [min, max]: [BNAudio, BNAudio] = useMemo(() => {
    const min = stringAudioToBN('0' as StringAudio)
    const max = weiToAudio(currentBalance)
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
    onSend(amountToSendBNWei, destinationAddress, Chain.Sol)
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

  const placeholderAddress = messages.addressSolPlaceholder

  const destinationText = messages.destinationSPL

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
          value={weiToAudio(amountToSendBNWei)}
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
          label={destinationText}
          placeholder={placeholderAddress}
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
