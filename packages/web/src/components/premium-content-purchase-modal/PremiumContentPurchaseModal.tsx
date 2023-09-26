import { useEffect } from 'react'

import {
  BNUSDC,
  Nullable,
  PurchasableTrackMetadata,
  PurchaseContentSchema,
  PurchaseContentStage,
  Track,
  isTrackPurchasable,
  useGetTrackById,
  usePremiumContentPurchaseModal,
  usePurchaseContentFormState,
  useUSDCBalance
} from '@audius/common'
import {
  IconCart,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@audius/stems'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Icon } from 'components/Icon'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { Text } from 'components/typography'
import { pushUniqueRoute } from 'utils/route'

import styles from './PremiumContentPurchaseModal.module.css'
import { PurchaseContentFormFields } from './components/PurchaseContentFormFields'
import { PurchaseContentFormFooter } from './components/PurchaseContentFormFooter'

const messages = {
  completePurchase: 'Complete Purchase'
}

const RenderForm = ({
  currentBalance,
  onClose,
  track
}: {
  currentBalance: Nullable<BNUSDC>
  onClose: () => void
  track: PurchasableTrackMetadata
}) => {
  const dispatch = useDispatch()
  const { handleConfirmPurchase, error, initialValues, isUnlocking, stage } =
    usePurchaseContentFormState({ track })
  const isPurchased = stage === PurchaseContentStage.FINISH

  // Navigate to track on successful purchase behind the modal
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH && track) {
      dispatch(pushUniqueRoute(track.permalink))
    }
  }, [stage, track, dispatch])

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(PurchaseContentSchema)}
      onSubmit={handleConfirmPurchase}
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
              <PurchaseContentFormFields
                price={track.premium_conditions.usdc_purchase.price}
                currentBalance={currentBalance}
                isPurchased={isPurchased}
              />
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
  )
}

export const PremiumContentPurchaseModal = () => {
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId: trackId }
  } = usePremiumContentPurchaseModal()

  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const { data: currentBalance } = useUSDCBalance()

  const isValidTrack = track && isTrackPurchasable(track)

  if (track && !isValidTrack) {
    console.error('PremiumContentPurchaseModal: Track is not purchasable')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      bodyClassName={styles.modal}
      dismissOnClickOutside
    >
      {isValidTrack ? (
        <RenderForm
          currentBalance={currentBalance}
          track={track}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  )
}
