import { useCallback, useEffect, useState } from 'react'

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
  Status
} from '@audius/common'
import { Modal, ModalContent, ModalHeader } from '@audius/stems'
import BN from 'bn.js'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ReactComponent as IconTransaction } from 'assets/img/iconTransaction.svg'
import { Icon } from 'components/Icon'
import { Text } from 'components/typography'
import { isValidSolAddress } from 'services/solana/solana'

import styles from './WithdrawUSDCModal.module.css'
import { ConfirmTransferDetails } from './components/ConfirmTransferDetails'
import { EnterTransferDetails } from './components/EnterTransferDetails'
import { Error } from './components/Error'
import { TransferInProgress } from './components/TransferInProgress'
import { TransferSuccessful } from './components/TransferSuccessful'

const { beginWithdrawUSDC } = withdrawUSDCActions
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

const WithdrawUSDCFormSchema = (userBalance: number) => {
  return z.object({
    [AMOUNT]: z
      .number()
      .lte(userBalance, messages.errors.insufficientBalance)
      .gte(1, messages.errors.amountTooLow),
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

  const onSuccess = useCallback(
    (signature: string) => {
      setData({
        page: WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL,
        signature
      })
    },
    [setData]
  )

  useEffect(() => {
    if (withdrawalStatus === Status.ERROR) {
      setData({
        page: WithdrawUSDCModalPages.ERROR
      })
    }
  }, [withdrawalStatus, setData])

  const handleSubmit = useCallback(
    ({ amount, address }: { amount: number; address: string }) => {
      dispatch(
        beginWithdrawUSDC({
          amount,
          destinationAddress: address,
          onSuccess
        })
      )
    },
    [dispatch, onSuccess]
  )

  let formPage
  switch (page) {
    case WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS:
      formPage = <EnterTransferDetails />
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
      formPage = <Error />
      break
  }

  return (
    <Modal
      size='medium'
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
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
          initialValues={{
            [AMOUNT]: balanceNumberCents,
            [ADDRESS]: '',
            [CONFIRM]: false
          }}
          validationSchema={toFormikValidationSchema(
            WithdrawUSDCFormSchema(balanceNumberCents)
          )}
          validateOnChange
          onSubmit={handleSubmit}
        >
          {formPage}
        </Formik>
      </ModalContent>
    </Modal>
  )
}
