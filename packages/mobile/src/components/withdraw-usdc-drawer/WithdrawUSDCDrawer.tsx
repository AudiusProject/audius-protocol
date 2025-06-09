import React, { useCallback, useRef } from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import type { BNUSDC } from '@audius/common/models'
import { Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  useWithdrawUSDCModal,
  WithdrawMethod,
  withdrawUSDCActions,
  WithdrawUSDCModalPages,
  withdrawUSDCSelectors,
  buyUSDCSelectors,
  isValidSolAddress
} from '@audius/common/store'
import { formatUSDCWeiToFloorCentsNumber } from '@audius/common/utils'
import BN from 'bn.js'
import type { FormikProps } from 'formik'
import { Formik, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Divider, Flex, Text } from '@audius/harmony-native'
import Drawer from 'app/components/drawer'

import { CoinflowConfirmTransfer } from './components/CoinflowConfirmTransfer'
import { CryptoConfirmTransfer } from './components/CryptoConfirmTransfer'
import { EnterTransferDetails } from './components/EnterTransferDetails'
import { PrepareTransfer } from './components/PrepareTransfer'
import { TransferInProgress } from './components/TransferInProgress'
import { TransferSuccessful } from './components/TransferSuccessful'
import {
  AMOUNT,
  METHOD,
  ADDRESS,
  DESTINATION,
  CONFIRM,
  type WithdrawFormValues
} from './types'

const MINIMUM_MANUAL_TRANSFER_AMOUNT_CENTS = 1

const { beginWithdrawUSDC } = withdrawUSDCActions
const { getWithdrawStatus } = withdrawUSDCSelectors
const { getRecoveryStatus } = buyUSDCSelectors

// Pages where the drawer should not be closable
const DISABLE_DRAWER_CLOSE_PAGES = new Set([
  WithdrawUSDCModalPages.PREPARE_TRANSFER,
  WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS,
  WithdrawUSDCModalPages.COINFLOW_TRANSFER
])

// Note: TRANSFER_SUCCESSFUL is intentionally not included as users should be able to close after success

const WithdrawUSDCFormSchema = (userBalanceCents: number) => {
  const amount = z
    .number()
    .min(
      MINIMUM_MANUAL_TRANSFER_AMOUNT_CENTS,
      walletMessages.errors.amountTooLow
    )
    .max(userBalanceCents, walletMessages.errors.insufficientBalance)

  return z.discriminatedUnion(METHOD, [
    z.object({
      [METHOD]: z.literal(WithdrawMethod.COINFLOW),
      [AMOUNT]: userBalanceCents !== 0 ? amount : z.number(),
      [ADDRESS]: z.string().optional(),
      [DESTINATION]: z.string().optional(),
      confirm: z.boolean().optional()
    }),
    z.object({
      [METHOD]: z.literal(WithdrawMethod.MANUAL_TRANSFER),
      [AMOUNT]: userBalanceCents !== 0 ? amount : z.number(),
      [ADDRESS]: z
        .string()
        .min(1, walletMessages.destinationRequired)
        .refine(isValidSolAddress, walletMessages.errors.invalidAddress),
      [DESTINATION]: z.string().optional(),
      [CONFIRM]: z.boolean().optional()
    })
  ])
}

const WithdrawUSDCForm = ({ onClose }: { onClose: () => void }) => {
  const { data } = useWithdrawUSDCModal()
  const { page } = data
  const { values } = useFormikContext<WithdrawFormValues>()

  let formPage
  switch (page) {
    case WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS:
      formPage = <EnterTransferDetails />
      break
    case WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS:
      formPage =
        values.method === WithdrawMethod.COINFLOW ? (
          <CoinflowConfirmTransfer />
        ) : (
          <CryptoConfirmTransfer />
        )
      break
    case WithdrawUSDCModalPages.PREPARE_TRANSFER:
      formPage = <PrepareTransfer />
      break
    case WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS:
      formPage = <TransferInProgress />
      break
    case WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL:
      formPage = <TransferSuccessful onDone={onClose} />
      break
    default:
      formPage = <EnterTransferDetails />
      break
  }

  return (
    <Flex gap='xl' pb='xl' ph='l'>
      <Flex gap='l'>
        <Flex row justifyContent='center' pt='xl'>
          <Text variant='label' strength='strong' size='xl' color='default'>
            {walletMessages.withdrawCash}
          </Text>
        </Flex>
        <Divider orientation='horizontal' />
      </Flex>
      {formPage}
    </Flex>
  )
}

export const WithdrawUSDCDrawer = () => {
  const dispatch = useDispatch()
  const { isOpen, onClose, onClosed, setData, data } = useWithdrawUSDCModal()
  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.COINFLOW_OFFRAMP_ENABLED
  )
  const { data: balance } = useUSDCBalance()
  const balanceNumberCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )

  // Track withdrawal and recovery status to prevent closing during critical operations
  const withdrawalStatus = useSelector(getWithdrawStatus)
  const recoveryStatus = useSelector(getRecoveryStatus)

  const formRef = useRef<FormikProps<WithdrawFormValues>>(null)

  // Determine if drawer should be closable based on current page and status
  const isClosable =
    !DISABLE_DRAWER_CLOSE_PAGES.has(data.page) &&
    withdrawalStatus !== Status.LOADING &&
    recoveryStatus !== Status.LOADING

  const handleClose = useCallback(() => {
    if (isClosable) {
      onClose()
      formRef.current?.resetForm()
      setData({ page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS })
    }
  }, [onClose, setData, isClosable])

  const handleClosed = useCallback(() => {
    onClosed()
  }, [onClosed])

  const handleSubmit = useCallback(
    ({ amount, method, address }: WithdrawFormValues) => {
      dispatch(
        beginWithdrawUSDC({
          amount: Math.round(amount * 100), // Convert to cents
          method,
          currentBalance: balanceNumberCents,
          destinationAddress: address || ''
        })
      )
    },
    [dispatch, balanceNumberCents]
  )

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={handleClosed}
      // Prevent all dismissal methods during critical operations
      blockClose={!isClosable}
    >
      <Formik
        innerRef={formRef}
        initialValues={{
          [AMOUNT]:
            balanceNumberCents > 0 ? Math.min(balanceNumberCents / 100, 10) : 0,
          [METHOD]: isCoinflowEnabled
            ? WithdrawMethod.COINFLOW
            : WithdrawMethod.MANUAL_TRANSFER,
          [ADDRESS]: '',
          [DESTINATION]: '',
          confirm: false
        }}
        validationSchema={toFormikValidationSchema(
          WithdrawUSDCFormSchema(balanceNumberCents)
        )}
        validateOnChange
        onSubmit={handleSubmit}
      >
        <WithdrawUSDCForm onClose={handleClose} />
      </Formik>
    </Drawer>
  )
}
