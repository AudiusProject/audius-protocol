import { useEffect } from 'react'

import {
  PurchasableTrackMetadata,
  PurchaseContentStage,
  Track,
  isTrackPurchasable,
  useGetTrackById,
  usePremiumContentPurchaseModal,
  usePurchaseContentFormConfiguration,
  usePurchaseContentFormState
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
  onClose,
  track
}: {
  onClose: () => void
  track: PurchasableTrackMetadata
}) => {
  const dispatch = useDispatch()
  const {
    permalink,
    premium_conditions: {
      usdc_purchase: { price }
    }
  } = track
  const state = usePurchaseContentFormState({ price })
  const { error, isUnlocking, purchaseSummaryValues, stage } = state

  // Navigate to track on successful purchase behind the modal
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH && permalink) {
      dispatch(pushUniqueRoute(permalink))
    }
  }, [stage, permalink, dispatch])

  return (
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
        <>
          <LockedTrackDetailsTile
            track={track as unknown as Track}
            owner={track.user}
          />
          <PurchaseContentFormFields
            stage={stage}
            purchaseSummaryValues={purchaseSummaryValues}
          />
        </>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <PurchaseContentFormFooter
          error={error}
          isUnlocking={isUnlocking}
          onViewTrackClicked={onClose}
          purchaseSummaryValues={purchaseSummaryValues}
          stage={stage}
          track={track}
        />
      </ModalFooter>
    </ModalForm>
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

  const { initialValues, validationSchema, onSubmit } =
    usePurchaseContentFormConfiguration({ track })

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
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          <RenderForm track={track} onClose={onClose} />
        </Formik>
      ) : null}
    </Modal>
  )
}
