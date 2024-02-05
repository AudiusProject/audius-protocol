import { useCallback } from 'react'

import { Status } from '@audius/common/models'
import {
  buyAudioSelectors,
  transactionDetailsActions,
  transactionDetailsSelectors,
  modalsActions
} from '@audius/common/store'
import { formatAudio, isNullOrUndefined } from '@audius/common/utils'
import { IconInfo } from '@audius/harmony'
import { Button, ButtonSize, ButtonType } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'

import { IconAUDIO } from './Icons'
import styles from './SuccessPage.module.css'

const messages = {
  successMessage: 'Transaction Was Successful!',
  audio: '$AUDIO',
  review: 'Review Transaction',
  done: 'Done'
}

const { getTransactionDetails } = transactionDetailsSelectors
const { setModalClosedAction: setOnTransactionDetailsModalClosedAction } =
  transactionDetailsActions
const { getOnSuccess } = buyAudioSelectors
const { setVisibility } = modalsActions

export const SuccessPage = () => {
  const dispatch = useDispatch()
  const transactionDetails = useSelector(getTransactionDetails)
  const onSuccess = useSelector(getOnSuccess)
  const [, setModalVisibility] = useModalState('BuyAudio')
  const [, setTransactionDetailsModalVisibility] =
    useModalState('TransactionDetails')

  const handleDoneClicked = useCallback(() => {
    if (onSuccess?.action) {
      dispatch(onSuccess.action)
      dispatch(setOnTransactionDetailsModalClosedAction())
    }
    setModalVisibility(false)
  }, [dispatch, setModalVisibility, onSuccess])

  const handleReviewTransactionClicked = useCallback(() => {
    dispatch(
      setOnTransactionDetailsModalClosedAction(
        setVisibility({ modal: 'BuyAudio', visible: true })
      )
    )
    setTransactionDetailsModalVisibility(true)
    setModalVisibility(false)
  }, [dispatch, setModalVisibility, setTransactionDetailsModalVisibility])

  return (
    <div className={styles.successPage}>
      <div className={styles.message}>{messages.successMessage}</div>
      <div className={styles.results}>
        <div className={styles.purchasedAmount}>
          <IconAUDIO />
          <span className={styles.label}>{messages.audio}</span>
          <span>
            +
            {transactionDetails.status === Status.SUCCESS
              ? formatAudio(transactionDetails.transactionDetails.change, 0)
              : '0'}
          </span>
        </div>
        {/* If user's balance is still loading or failed to load, don't show it. */}
        {transactionDetails.status !== Status.SUCCESS ||
        isNullOrUndefined(
          transactionDetails.transactionDetails.balance
        ) ? null : (
          <div className={styles.newBalance}>
            {formatAudio(transactionDetails.transactionDetails.balance, 0)}
            <span className={styles.label}>{messages.audio}</span>
          </div>
        )}
      </div>
      <Button
        text={onSuccess?.message ?? messages.done}
        type={ButtonType.PRIMARY_ALT}
        onClick={handleDoneClicked}
      />
      <div className={styles.review}>
        <Button
          iconClassName={styles.reviewButtonIcon}
          type={ButtonType.TEXT}
          size={ButtonSize.SMALL}
          text={messages.review}
          leftIcon={<IconInfo />}
          onClick={handleReviewTransactionClicked}
        />
      </div>
    </div>
  )
}
