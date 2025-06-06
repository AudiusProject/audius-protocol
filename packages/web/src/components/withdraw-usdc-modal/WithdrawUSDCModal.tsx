import { useCallback, useEffect, useRef, useState } from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useFeatureFlag, useRemoteVar } from '@audius/common/hooks'
import {
  Name,
  Status,
  BNUSDC,
  SolanaWalletAddress
} from '@audius/common/models'
import { IntKeys, FeatureFlags } from '@audius/common/services'
import {
  withdrawUSDCActions,
  withdrawUSDCSelectors,
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  WithdrawMethod
} from '@audius/common/store'
import { formatUSDCWeiToFloorCentsNumber } from '@audius/common/utils'
import {
  Modal,
  ModalContent,
  ModalHeader,
  IconTransaction,
  ModalTitle
} from '@audius/harmony'
import BN from 'bn.js'
import { Formik, FormikProps, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { make, track } from 'services/analytics'
import { isValidSolAddress } from 'services/solana/solana'

import styles from './WithdrawUSDCModal.module.css'
import { CoinflowWithdrawPage } from './components/CoinflowWithdrawPage'
import { ConfirmTransferDetails } from './components/ConfirmTransferDetails'
import { EnterTransferDetails } from './components/EnterTransferDetails'
import { ErrorPage } from './components/ErrorPage'
import { PrepareTransfer } from './components/PrepareTransfer'
import { TransferInProgress } from './components/TransferInProgress'
import { TransferSuccessful } from './components/TransferSuccessful'
import { ADDRESS, AMOUNT, CONFIRM, METHOD, WithdrawFormValues } from './types'

const { beginWithdrawUSDC, cleanup } = withdrawUSDCActions
const { getWithdrawStatus } = withdrawUSDCSelectors

const messages = {
  title: 'Withdraw Cash',
  errors: {
    insufficientBalance:
      'Your cash balance is insufficient to complete this transaction.',
    amountTooLow: 'Please withdraw at least $0.01.',
    invalidAddress: 'A valid Solana USDC wallet address is required.',
    minCashTransfer: 'A minimum of $5 is required for cash withdrawals.',
    pleaseConfirm:
      'Please confirm you have reviewed this transaction and accept responsibility for errors.'
  }
}

const MINIMUM_MANUAL_TRANSFER_AMOUNT_CENTS = 1

const DISABLE_MODAL_CLOSE_PAGES = new Set([
  WithdrawUSDCModalPages.PREPARE_TRANSFER,
  WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS,
  WithdrawUSDCModalPages.COINFLOW_TRANSFER,
  WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS
])

const WithdrawUSDCFormSchema = (
  userBalanceCents: number,
  minWithdrawBalanceCents: number
) => {
  const amount = z
    .number()
    .lte(userBalanceCents, messages.errors.insufficientBalance)

  return z.discriminatedUnion(METHOD, [
    z.object({
      [METHOD]: z.literal(WithdrawMethod.COINFLOW),
      // If user has no balance, don't validate minimum, the form will just be disabled
      [AMOUNT]:
        userBalanceCents !== 0
          ? amount.gte(minWithdrawBalanceCents, messages.errors.minCashTransfer)
          : amount
    }),
    z.object({
      [METHOD]: z.literal(WithdrawMethod.MANUAL_TRANSFER),
      // If user has no balance, don't validate minimum, the form will just be disabled
      [AMOUNT]:
        userBalanceCents !== 0
          ? amount.gte(
              MINIMUM_MANUAL_TRANSFER_AMOUNT_CENTS,
              messages.errors.amountTooLow
            )
          : amount,
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
  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.COINFLOW_OFFRAMP_ENABLED
  )
  const minCashTransferBalanceCents = useRemoteVar(
    IntKeys.MIN_USDC_WITHDRAW_BALANCE_CENTS
  )
  const { page } = data
  const { data: balance } = useUSDCBalance()
  const balanceNumberCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const withdrawalStatus = useSelector(getWithdrawStatus)

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
      method: WithdrawMethod
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
    case WithdrawUSDCModalPages.PREPARE_TRANSFER:
      formPage = <PrepareTransfer />
      break
    case WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS:
      formPage = <TransferInProgress />
      break
    case WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL:
      formPage = <TransferSuccessful onClickDone={onClose} />
      break
    case WithdrawUSDCModalPages.ERROR:
      formPage = <ErrorPage />
      break
  }

  const formRef = useRef<FormikProps<WithdrawFormValues>>(null)

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
      dismissOnClickOutside={!DISABLE_MODAL_CLOSE_PAGES.has(page)}
      bodyClassName={styles.modal}
    >
      {page !== WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS ? (
        <ModalHeader
          onClose={onClose}
          showDismissButton={!DISABLE_MODAL_CLOSE_PAGES.has(page)}
        >
          <ModalTitle icon={<IconTransaction />} title={messages.title} />
        </ModalHeader>
      ) : null}
      <ModalContent>
        <Formik
          innerRef={formRef}
          initialValues={{
            [AMOUNT]: balanceNumberCents,
            [ADDRESS]: '',
            [CONFIRM]: false,
            [METHOD]: isCoinflowEnabled
              ? WithdrawMethod.COINFLOW
              : WithdrawMethod.MANUAL_TRANSFER
          }}
          validationSchema={toFormikValidationSchema(
            WithdrawUSDCFormSchema(
              balanceNumberCents,
              minCashTransferBalanceCents
            )
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
