import React, { useCallback, useMemo, useState } from 'react'

import {
  Button,
  TokenValueInput,
  Format,
  IconValidationX,
  ButtonType
} from '@audius/stems'

import { ReactComponent as IconGoldBadgeSVG } from 'assets/img/IconGoldBadge.svg'
import {
  BNAudio,
  BNWei,
  StringAudio,
  StringWei,
  WalletAddress
} from 'common/models/Wallet'
import { convertFloatToWei } from 'common/utils/formatUtil'
import { Nullable } from 'common/utils/typeUtils'
import { MIN_TRANSFERRABLE_WEI } from 'services/wallet-client/WalletClient'
import {
  audioToWei,
  stringAudioToBN,
  stringWeiToBN,
  weiToAudio
} from 'utils/wallet'

import { ModalBodyTitle, ModalBodyWrapper } from '../WalletModal'

import DashboardTokenValueSlider from './DashboardTokenValueSlider'
import styles from './SendInputBody.module.css'

const messages = {
  warningTitle: 'PROCEED WITH CAUTION',
  warningSubtitle: 'If you send $AUDIO to the wrong address it will be lost.',
  warningSubtitle2:
    'WARNING: $AUDIO sent will not count towards badges, tiers, and unlocked features!',
  addressPlaceholder: '0xC7EF9651259197aA26544Af724441a46e491c12c',
  sendAudio: 'SEND $AUDIO',
  insufficientBalance: 'Account does not have enough $AUDIO',
  amountRequired: 'Amount is a required field',
  amountInsufficient: 'This amount of $AUDIO is too low to send.',
  amountMalformed: 'Amount must be a valid number',
  addressMalformed: 'Please enter a valid address',
  addressRequired: 'Address is required',
  addressIsSelf: 'You cannot send $AUDIO to your own wallet!',
  sendAmountLabel: 'Amount to SEND',
  destination: 'Destination Address'
}

type BalanceError =
  | 'INSUFFICIENT_BALANCE'
  | 'INSUFFICIENT_TRANSFER_AMOUNT'
  | 'EMPTY'
  | 'MALFORMED'
type AddressError = 'MALFORMED' | 'EMPTY' | 'SEND_TO_SELF'

const balanceErrorMap: { [B in BalanceError]: string } = {
  INSUFFICIENT_BALANCE: messages.insufficientBalance,
  EMPTY: messages.amountRequired,
  MALFORMED: messages.amountMalformed,
  INSUFFICIENT_TRANSFER_AMOUNT: messages.amountInsufficient
}

const addressErrorMap: { [A in AddressError]: string } = {
  MALFORMED: messages.addressMalformed,
  EMPTY: messages.addressRequired,
  SEND_TO_SELF: messages.addressIsSelf
}

type SendInputBodyProps = {
  currentBalance: BNWei
  onSend: (balance: BNWei, destinationAddress: WalletAddress) => void
  wallet: WalletAddress
}

const isValidDestination = (wallet: WalletAddress) => {
  const libs = window.audiusLibs
  return libs.web3Manager.web3.utils.isAddress(wallet)
}

const validateWallet = (
  wallet: Nullable<WalletAddress>,
  ownWallet: WalletAddress
): Nullable<AddressError> => {
  if (!wallet) return 'EMPTY'
  if (!isValidDestination(wallet)) return 'MALFORMED'
  if (wallet.toLowerCase() === ownWallet.toLowerCase()) return 'SEND_TO_SELF'
  return null
}

const validateSendAmount = (
  stringAudioAmount: StringAudio,
  balanceWei: BNWei
): Nullable<BalanceError> => {
  if (!stringAudioAmount.length) return 'EMPTY'
  const sendWeiBN = parseAudioInputToWei(stringAudioAmount)
  if (!sendWeiBN) return 'MALFORMED'
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

const parseAudioInputToWei = (audio: StringAudio): Nullable<BNWei> => {
  if (!audio.length) return null
  // First try converting from float, in case audio has decimal value
  const floatWei = convertFloatToWei(audio) as Nullable<BNWei>
  if (floatWei) return floatWei
  // Safe to assume no decimals
  try {
    return audioToWei(audio)
  } catch {
    return null
  }
}

const SendInputBody = ({
  currentBalance,
  onSend,
  wallet
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

  const onChangeAmount = useCallback(
    (value: string) => {
      setAmountToSend(value as StringAudio)
      if (balanceError) setBalanceError(null)
    },
    [balanceError, setBalanceError, setAmountToSend]
  )

  const onChangeAddress = useCallback(
    (value: string) => {
      setDestinationAddress(value)
      if (addressError) setAddressError(null)
    },
    [addressError, setAddressError, setDestinationAddress]
  )

  const onClickSend = () => {
    const balanceError = validateSendAmount(amountToSend, currentBalance)
    const walletError = validateWallet(destinationAddress, wallet)
    setBalanceError(balanceError)
    setAddressError(walletError)
    if (balanceError || walletError) return
    onSend(amountToSendBNWei, destinationAddress)
  }

  const renderBalanceError = () => {
    if (!balanceError) return null
    return <ErrorLabel text={balanceErrorMap[balanceError]} />
  }

  const renderAddressError = () => {
    if (!addressError) return null
    return <ErrorLabel text={addressErrorMap[addressError]} />
  }

  return (
    <ModalBodyWrapper>
      <div className={styles.titleContainer}>
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
      <TokenValueInput
        className={styles.inputContainer}
        labelClassName={styles.label}
        rightLabelClassName={styles.label}
        inputClassName={styles.input}
        label={messages.sendAmountLabel}
        format={Format.INPUT}
        placeholder={'0'}
        rightLabel={'$AUDIO'}
        value={amountToSend}
        isNumeric={true}
        onChange={onChangeAmount}
      />
      {renderBalanceError()}
      <TokenValueInput
        className={styles.inputContainer}
        labelClassName={styles.label}
        rightLabelClassName={styles.label}
        inputClassName={styles.input}
        label={messages.destination}
        format={Format.INPUT}
        placeholder={messages.addressPlaceholder}
        value={destinationAddress}
        isNumeric={false}
        onChange={onChangeAddress}
      />
      {renderAddressError()}
      <Button
        className={styles.sendBtn}
        text={messages.sendAudio}
        textClassName={styles.sendBtnText}
        onClick={onClickSend}
        type={hasError ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT}
      />
    </ModalBodyWrapper>
  )
}

export default SendInputBody
