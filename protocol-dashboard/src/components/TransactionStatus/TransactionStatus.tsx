import React, { useCallback, useEffect, ReactNode } from 'react'

import { IconRemove, IconCheck } from '@audius/stems'
import clsx from 'clsx'

import Button, { ButtonType } from 'components/Button'
import ConfirmTransactionModal, {
  StandaloneBox
} from 'components/ConfirmTransactionModal'
import Loading from 'components/Loading'
import AudiusClient from 'services/Audius'
import { usePendingTransactions } from 'store/account/hooks'
import { useCancelTransaction } from 'store/actions/cancelTransaction'
import { useSubmitTransaction } from 'store/actions/submitTransaction'
import { useEthBlockNumber, useTimeRemaining } from 'store/cache/protocol/hooks'
import {
  Status,
  DelayedPendingTransaction,
  PendingTransactionName
} from 'types'
import { TICKER } from 'utils/consts'
import { getHumanReadableTime } from 'utils/format'
import { useModalControls } from 'utils/hooks'

import styles from './TransactionStatus.module.css'

const messages = {
  ready: 'Ready',
  timeRemaining: 'remaining',
  cancel: 'CANCEL',
  confirm: 'CONFIRM',
  claim: 'MAKE CLAIM',
  target: 'Target block'
}

const getMessage = (
  props: DelayedPendingTransaction,
  isCancel: boolean
): ReactNode => {
  const textPrefix = isCancel ? 'Cancel' : 'Confirm'
  switch (props.name) {
    case PendingTransactionName.DecreaseStake: {
      return `${textPrefix} Request to ${
        props.name
      } by ${AudiusClient.displayAud(props.amount)} ${TICKER}`
    }
    case PendingTransactionName.RemoveDelegator: {
      return (
        <>
          <div>{`${textPrefix} Request to ${props.name}`}</div>
          <div className={styles.subtext}>{props.target}</div>
        </>
      )
    }
    case PendingTransactionName.Undelegate: {
      return (
        <>
          <div>{`${textPrefix} Request to ${props.name}`}</div>
          <div className={styles.subtext}>{props.target}</div>
        </>
      )
    }
    case PendingTransactionName.UpdateOperatorCut: {
      return `${textPrefix} Request to ${props.name} to ${props.newDeployerCut}%`
    }
  }
}

type WaitingTransactionProps = {
  className?: string
  ethBlockNumber: number
} & DelayedPendingTransaction

const WaitingTransaction: React.FC<WaitingTransactionProps> = (props) => {
  const { isOpen, onClick, onClose } = useModalControls()
  const { status, error, setError, setStatus, cancelTransaction } =
    useCancelTransaction(props.name, !isOpen)

  const onCloseModal = useCallback(() => {
    setStatus(undefined)
    setError('')
    onClose()
  }, [onClose, setStatus, setError])

  const cancelTransactionBox = (
    <StandaloneBox> {getMessage(props, true)} </StandaloneBox>
  )

  useEffect(() => {
    if (status === Status.Success) {
      onCloseModal()
    }
  }, [status, onCloseModal])

  // @ts-ignore
  const { name, target } = props
  const onCancelSubmit = useCallback(() => {
    if (name === PendingTransactionName.RemoveDelegator) {
      cancelTransaction(target)
    } else {
      cancelTransaction()
    }
  }, [name, target, cancelTransaction])
  const { timeRemaining } = useTimeRemaining(
    props.lockupExpiryBlock,
    0 /* period - 0 because lockupExpiry has time period baked in */
  )

  return (
    <div
      className={clsx(styles.transactionItemContainer, {
        [props.className!]: !!props.className
      })}
    >
      <Loading className={styles.loading} />
      <div className={styles.textContainer}>
        <div className={styles.primaryText}>{`Pending ${props.name}`}</div>
        {timeRemaining !== null && (
          <div className={styles.secondaryText}>
            {`${messages.target} ${
              props.lockupExpiryBlock
            } - ${getHumanReadableTime(timeRemaining)} ${
              messages.timeRemaining
            }`}
          </div>
        )}
      </div>
      <Button
        leftIcon={<IconRemove />}
        className={styles.btn}
        onClick={onClick}
        textClassName={styles.btnText}
        iconClassName={styles.btnIcon}
        text={messages.cancel}
        type={ButtonType.PRIMARY_ALT}
      />
      <ConfirmTransactionModal
        isOpen={isOpen}
        onClose={onCloseModal}
        withArrow={false}
        topBox={cancelTransactionBox}
        onConfirm={onCancelSubmit}
        status={status}
        error={error}
      />
    </div>
  )
}

type ReadyTransactionProps = {
  className?: string
} & DelayedPendingTransaction

const ReadyTransaction: React.FC<ReadyTransactionProps> = (props) => {
  const {
    isOpen: isCancelOpen,
    onClick: onClickCancel,
    onClose: onCloseCancel
  } = useModalControls()
  const {
    isOpen: isSubmitOpen,
    onClick: onClickSubmit,
    onClose: onCloseSubmit
  } = useModalControls()
  const {
    status: cancelStatus,
    error: cancelError,
    cancelTransaction
  } = useCancelTransaction(props.name, !isCancelOpen)
  const {
    status: submitStatus,
    error: submitError,
    submitTransaction
  } = useSubmitTransaction(props.name, !isSubmitOpen)

  useEffect(() => {
    if (cancelStatus === Status.Success || submitStatus === Status.Success) {
      onCloseCancel()
      onCloseSubmit()
    }
  }, [cancelStatus, onCloseCancel, onCloseSubmit, submitStatus])

  const cancelTransactionBox = (
    <StandaloneBox> {getMessage(props, true)} </StandaloneBox>
  )

  const confirmTransactionBox = (
    <StandaloneBox> {getMessage(props, false)} </StandaloneBox>
  )

  // @ts-ignore
  const { name, target } = props
  const onConfirmSubmit = useCallback(() => {
    if (name === PendingTransactionName.RemoveDelegator) {
      submitTransaction(target)
    } else {
      submitTransaction()
    }
  }, [name, target, submitTransaction])

  const onCancelSubmit = useCallback(() => {
    if (name === PendingTransactionName.RemoveDelegator) {
      cancelTransaction(target)
    } else {
      cancelTransaction()
    }
  }, [name, target, cancelTransaction])

  return (
    <div
      className={clsx(styles.transactionItemContainer, {
        [props.className!]: !!props.className
      })}
    >
      <div className={styles.textContainer}>
        <div className={styles.primaryText}>{props.name}</div>
        <div className={styles.secondaryText}>{messages.ready}</div>
      </div>
      <Button
        leftIcon={<IconRemove />}
        text={messages.cancel}
        className={clsx(styles.btn, styles.readyCancelBtn)}
        textClassName={styles.btnText}
        iconClassName={styles.btnIcon}
        onClick={onClickCancel}
        type={ButtonType.PRIMARY_ALT}
      />
      <Button
        leftIcon={<IconCheck />}
        text={messages.confirm}
        className={styles.btn}
        textClassName={styles.btnText}
        iconClassName={styles.btnIcon}
        type={ButtonType.PRIMARY}
        onClick={onClickSubmit}
      />
      <ConfirmTransactionModal
        isOpen={isCancelOpen}
        onClose={onCloseCancel}
        onConfirm={onCancelSubmit}
        status={cancelStatus}
        error={cancelError}
        withArrow={false}
        topBox={cancelTransactionBox}
      />
      <ConfirmTransactionModal
        isOpen={isSubmitOpen}
        onClose={onCloseSubmit}
        onConfirm={onConfirmSubmit}
        status={submitStatus}
        error={submitError}
        withArrow={false}
        topBox={confirmTransactionBox}
      />
    </div>
  )
}

interface TransactionStatusProps {
  className?: string
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({ className }) => {
  const pendingTx = usePendingTransactions()
  const ethBlockNumber = useEthBlockNumber()
  if (
    pendingTx.status !== Status.Success ||
    !Array.isArray(pendingTx.transactions) ||
    pendingTx.transactions?.length === 0 ||
    !ethBlockNumber
  ) {
    return null
  }
  return (
    <div
      className={clsx(styles.container, {
        [className!]: !!className
      })}
    >
      {pendingTx.transactions.map((t, idx) => {
        if (t.lockupExpiryBlock > ethBlockNumber) {
          return (
            <div key={idx} className={styles.transactionWrapper}>
              <WaitingTransaction {...t} ethBlockNumber={ethBlockNumber} />
            </div>
          )
        }
        return (
          <div key={idx} className={styles.transactionWrapper}>
            <ReadyTransaction {...t} />
          </div>
        )
      })}
    </div>
  )
}

export default TransactionStatus
