import { useCallback, useEffect, useRef, useState } from 'react'

import {
  SolanaWalletAddress,
  useUSDCBalance,
  useWithdrawUSDCModal,
  WithdrawUSDCModalPages,
  withdrawUSDCActions,
  BNUSDC,
  formatUSDCWeiToFloorCentsNumber,
  Nullable,
  withdrawUSDCSelectors,
  Status,
  Name,
  WithdrawalMethod
} from '@audius/common'
import { Modal, ModalContent, ModalHeader } from '@audius/stems'
import BN from 'bn.js'
import { Formik, FormikProps, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import IconTransaction from 'assets/img/iconTransaction.svg'
import { Icon } from 'components/Icon'
import { Text } from 'components/typography'
import { make, track } from 'services/analytics'
import { isValidSolAddress } from 'services/solana/solana'

import styles from './WithdrawUSDCModal.module.css'
import { CoinflowWithdrawPage } from './components/CoinflowWithdrawPage'
import { ConfirmTransferDetails } from './components/ConfirmTransferDetails'
import { EnterTransferDetails } from './components/EnterTransferDetails'
import { ErrorPage } from './components/ErrorPage'
import { TransferInProgress } from './components/TransferInProgress'
import { TransferSuccessful } from './components/TransferSuccessful'

const { beginWithdrawUSDC, cleanup } = withdrawUSDCActions
const { getWithdrawStatus } = withdrawUSDCSelectors

const messages = {
  title: 'Withdraw Funds',
  errors: {
    insufficientBalance:
      'Your USDC wallet does not have enough funds to cover this transaction.',
    amountTooLow: 'Please withdraw at least $0.01.',
    invalidAddress: 'A valid Solana USDC wallet address is required.',
    pleaseConfirm:
      'Please confirm you have reviewed the details and accept responsibility for any errors resulting in lost funds.'
  }
}

export const AMOUNT = 'amount'
export const ADDRESS = 'address'
export const CONFIRM = 'confirm'
export const METHOD = 'method'

type WithdrawFormValues = {
  [AMOUNT]: number
  [ADDRESS]: string
  [CONFIRM]: boolean
  [METHOD]: WithdrawalMethod
}

const WithdrawUSDCFormSchema = (userBalance: number) => {
  let amount = z.number().lte(userBalance, messages.errors.insufficientBalance)
  if (userBalance !== 0) {
    // If user has no balance, don't validate minimum, the form will just be disabled
    amount = amount.gte(1, messages.errors.amountTooLow)
  }

  return z.discriminatedUnion(METHOD, [
    z.object({
      [METHOD]: z.literal(WithdrawalMethod.COINFLOW),
      [AMOUNT]: amount
    }),
    z.object({
      [METHOD]: z.literal(WithdrawalMethod.MANUAL_TRANSFER),
      [AMOUNT]: amount,
      [ADDRESS]: z
        .string()
        .refine(
          (value) => isValidSolAddress(value as SolanaWalletAddress),
          messages.errors.invalidAddress
        ),
      [CONFIRM]: z.literal(true, {
        errorMap: () => ({ message: messages.errors.pleaseConfirm })
      })
    })
  ])
}

/** Tracks form errors of interest, only sending events the first time
 * each error occurs on a changed value. For example:
 * 1. User enters invalid address: event fired
 * 2. User changes address and still invalid: no event
 * 3. User changes address and it's now valid: no event
 * 4. User changes address and it's invalid again: event fired
 */
const TrackFormErrors = ({ currentBalance }: { currentBalance: number }) => {
  const {
    errors: { [ADDRESS]: addressError },
    values: { [ADDRESS]: address }
  } = useFormikContext<WithdrawFormValues>()
  const [prevAddressError, setPrevAddressError] = useState<string>()
  if (addressError !== prevAddressError) {
    if (addressError === messages.errors.invalidAddress) {
      track(
        make({
          eventName: Name.WITHDRAW_USDC_FORM_ERROR,
          error: addressError,
          value: address,
          currentBalance: currentBalance / 100
        })
      )
    }
    setPrevAddressError(addressError)
  }

  return null
}

export const WithdrawUSDCModal = () => {
  const dispatch = useDispatch()
  const { isOpen, onClose, onClosed, data, setData } = useWithdrawUSDCModal()
  const { page } = data
  const { data: balance } = useUSDCBalance()
  const balanceNumberCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const withdrawalStatus = useSelector(getWithdrawStatus)

  const [priorBalanceCents, setPriorBalanceCents] =
    useState<Nullable<number>>(null)

  useEffect(() => {
    if (balanceNumberCents && priorBalanceCents === null) {
      setPriorBalanceCents(balanceNumberCents)
    }
  }, [balanceNumberCents, priorBalanceCents, setPriorBalanceCents])

  useEffect(() => {
    if (withdrawalStatus === Status.ERROR) {
      setData({
        page: WithdrawUSDCModalPages.ERROR
      })
    }
  }, [withdrawalStatus, setData])

  const handleSubmit = useCallback(
    ({
      amount,
      address,
      method
    }: {
      amount: number
      address: string
      method: WithdrawalMethod
    }) => {
      dispatch(
        beginWithdrawUSDC({
          amount,
          method,
          currentBalance: balanceNumberCents,
          destinationAddress: address
        })
      )
    },
    [balanceNumberCents, dispatch]
  )

  let formPage
  switch (page) {
    case WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS:
      formPage = <EnterTransferDetails />
      break
    case WithdrawUSDCModalPages.COINFLOW_TRANSFER:
      formPage = <CoinflowWithdrawPage />
      break
    case WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS:
      formPage = <ConfirmTransferDetails />
      break
    case WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS:
      formPage = <TransferInProgress />
      break
    case WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL:
      formPage = (
        <TransferSuccessful priorBalanceCents={priorBalanceCents || 0} />
      )
      break
    case WithdrawUSDCModalPages.ERROR:
      formPage = <ErrorPage />
      break
  }

  const formRef = useRef<
    FormikProps<{
      amount: number
      address: string
      confirm: boolean
      method: WithdrawalMethod
    }>
  >(null)

  const handleOnClosed = useCallback(() => {
    dispatch(cleanup())
    onClosed()
    formRef.current?.resetForm()
  }, [dispatch, onClosed, formRef])

  return (
    <Modal
      size='medium'
      isOpen={isOpen}
      onClose={onClose}
      onClosed={handleOnClosed}
      bodyClassName={styles.modal}
    >
      <ModalHeader onClose={onClose}>
        <Text
          variant='label'
          color='neutralLight2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          <Icon size='large' icon={IconTransaction} />
          {messages.title}
        </Text>
      </ModalHeader>
      <ModalContent>
        <Formik
          innerRef={formRef}
          initialValues={{
            [AMOUNT]: balanceNumberCents,
            [ADDRESS]: '',
            [CONFIRM]: false,
            [METHOD]: WithdrawalMethod.COINFLOW
          }}
          validationSchema={toFormikValidationSchema(
            WithdrawUSDCFormSchema(balanceNumberCents)
          )}
          validateOnChange
          onSubmit={handleSubmit}
        >
          <>
            {formPage}
            <TrackFormErrors currentBalance={balanceNumberCents} />
          </>
        </Formik>
      </ModalContent>
    </Modal>
  )
}
