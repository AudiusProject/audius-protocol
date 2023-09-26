import { useCallback, useEffect } from 'react'

import {
  ContentType,
  PurchaseContentStage,
  Track,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors,
  useGetTrackById,
  usePremiumContentPurchaseModal,
  useUSDCBalance,
  buyUSDCActions,
  buyUSDCSelectors
} from '@audius/common'
import {
  IconCart,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@audius/stems'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Icon } from 'components/Icon'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { Text } from 'components/typography'
import { pushUniqueRoute } from 'utils/route'

import styles from './PremiumContentPurchaseModal.module.css'
import { PurchaseContentFormFields } from './components/PurchaseContentFormFields'
import { PurchaseContentFormFooter } from './components/PurchaseContentFormFooter'
import { CUSTOM_AMOUNT, AMOUNT_PRESET } from './components/constants'
import { PayExtraPreset } from './components/types'
import {
  PurchaseContentSchema,
  PurchaseContentValues
} from './components/validation'
import { getExtraAmount } from './hooks'

const { startRecoveryIfNecessary, cleanup } = buyUSDCActions
const { getRecoveryStatus } = buyUSDCSelectors

const messages = {
  completePurchase: 'Complete Purchase'
}
const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

export const PremiumContentPurchaseModal = () => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE
  }
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId: trackId }
  } = usePremiumContentPurchaseModal()

  const { refresh } = useUSDCBalance()
  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const recoveryStatus = useSelector(getRecoveryStatus)

  useEffect(() => {
    if (trackId) {
      dispatch(startRecoveryIfNecessary)
    }
  }, [trackId, dispatch])

  useEffect(() => {
    if (recoveryStatus === 'success') {
      refresh()
    }
  }, [recoveryStatus, refresh])

  const handleClose = useCallback(() => {
    dispatch(cleanup())
    onClose()
  }, [dispatch, onClose])

  const handleSubmit = useCallback(
    ({ customAmount, amountPreset }: PurchaseContentValues) => {
      if (isUnlocking || !track?.track_id) return

      const extraAmount = getExtraAmount(amountPreset, customAmount)

      dispatch(
        startPurchaseContentFlow({
          extraAmount,
          extraAmountPreset: amountPreset,
          contentId: track?.track_id,
          contentType: ContentType.TRACK
        })
      )
    },
    [isUnlocking, dispatch, track?.track_id]
  )

  // Navigate to track on successful purchase behind the modal
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH && track) {
      dispatch(pushUniqueRoute(track.permalink))
    }
  }, [stage, track, dispatch])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={onClosed}
      bodyClassName={styles.modal}
      dismissOnClickOutside
    >
      <Formik
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(PurchaseContentSchema)}
        onSubmit={handleSubmit}
      >
        <ModalForm>
          <ModalHeader onClose={onClose} showDismissButton>
            <Text
              variant='label'
              color='neutralLight2'
              size='xLarge'
              strength='strong'
              className={styles.title}
            >
              <Icon size='large' icon={IconCart} />
              {messages.completePurchase}
            </Text>
          </ModalHeader>
          <ModalContent className={styles.content}>
            {track ? (
              <>
                <LockedTrackDetailsTile
                  track={track as unknown as Track}
                  owner={track.user}
                />
                <PurchaseContentFormFields track={track} />
              </>
            ) : null}
          </ModalContent>
          <ModalFooter className={styles.footer}>
            {track ? (
              <PurchaseContentFormFooter
                track={track}
                onViewTrackClicked={onClose}
              />
            ) : null}
          </ModalFooter>
        </ModalForm>
      </Formik>
    </Modal>
  )
}
