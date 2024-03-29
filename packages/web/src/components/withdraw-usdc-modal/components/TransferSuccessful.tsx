import { useCallback } from 'react'

import { useUSDCBalance } from '@audius/common/hooks'
import { Name, Status, BNUSDC } from '@audius/common/models'
import { withdrawUSDCSelectors, WithdrawMethod } from '@audius/common/store'
import {
  decimalIntegerToHumanReadable,
  formatUSDCWeiToFloorCentsNumber,
  makeSolanaTransactionLink
} from '@audius/common/utils'
import {
  Button,
  Flex,
  IconExternalLink,
  Text,
  PlainButton,
  IconValidationCheck
} from '@audius/harmony'
import BN from 'bn.js'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import { Divider } from 'components/divider'
import { make, track } from 'services/analytics'

import { ADDRESS, AMOUNT, METHOD } from '../types'

import { TextRow } from './TextRow'
import styles from './TransferSuccessful.module.css'

const { getWithdrawTransaction } = withdrawUSDCSelectors

const messages = {
  priorBalance: 'Prior Balance',
  newBalance: 'New Balance',
  amountWithdrawn: 'Amount Withdrawn',
  destinationAddress: 'Destination Address',
  viewOn: 'View On Solana Block Explorer',
  success: 'Your Withdrawal Was Successful!',
  done: 'Done'
}

const openExplorer = (signature: string) => {
  window.open(
    makeSolanaTransactionLink(signature),
    '_blank',
    'noreferrer,noopener'
  )
}

export const TransferSuccessful = ({
  priorBalanceCents,
  onClickDone
}: {
  priorBalanceCents: number
  onClickDone: () => void
}) => {
  const { data: balance, status: balanceStatus } = useUSDCBalance()
  const signature = useSelector(getWithdrawTransaction)
  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

  const [{ value: methodValue }] = useField<string>(METHOD)
  const [{ value: amountValue }] = useField<number>(AMOUNT)
  const [{ value: addressValue }] = useField<string>(ADDRESS)

  const handleClickTransactionLink = useCallback(() => {
    if (!signature) return
    openExplorer(signature)
    track(
      make({
        eventName: Name.WITHDRAW_USDC_TRANSACTION_LINK_CLICKED,
        priorBalance: priorBalanceCents / 100,
        currentBalance: balanceNumber / 100,
        amount: amountValue / 100,
        destinationAddress: addressValue,
        signature
      })
    )
  }, [signature, balanceNumber, priorBalanceCents, amountValue, addressValue])

  return (
    <div className={styles.root}>
      <TextRow
        left={messages.priorBalance}
        right={`$${decimalIntegerToHumanReadable(priorBalanceCents)}`}
      />
      <Divider style={{ margin: 0 }} />
      <TextRow
        left={messages.amountWithdrawn}
        right={`-$${decimalIntegerToHumanReadable(amountValue)}`}
      />
      <Divider style={{ margin: 0 }} />
      <TextRow
        left={messages.newBalance}
        right={
          balanceStatus === Status.SUCCESS ? `$${balanceFormatted}` : undefined
        }
      />
      {methodValue === WithdrawMethod.MANUAL_TRANSFER && signature ? (
        <>
          <Divider style={{ margin: 0 }} />
          <div className={styles.destination}>
            <TextRow left={messages.destinationAddress} />
            <Text variant='body' size='m' strength='default'>
              {addressValue}
            </Text>
            <PlainButton
              css={{ padding: 0 }}
              onClick={handleClickTransactionLink}
              iconRight={IconExternalLink}
              variant='subdued'
              size='default'
            >
              {messages.viewOn}
            </PlainButton>
          </div>
        </>
      ) : null}
      <div className={styles.success}>
        <IconValidationCheck size='m' />
        <Text variant='heading' size='s' strength='default'>
          {messages.success}
        </Text>
      </div>
      <Flex alignItems='center' justifyContent='center' gap='m'>
        <Button fullWidth variant='primary' onClick={onClickDone}>
          {messages.done}
        </Button>
      </Flex>
    </div>
  )
}
