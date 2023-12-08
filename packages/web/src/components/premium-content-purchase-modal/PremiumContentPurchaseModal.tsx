import { useCallback, useEffect } from 'react'

import {
  PurchasableTrackMetadata,
  PurchaseContentStage,
  Track,
  isTrackPurchasable,
  useGetTrackById,
  usePremiumContentPurchaseModal,
  usePurchaseContentFormConfiguration,
  buyUSDCActions,
  purchaseContentActions,
  purchaseContentSelectors,
  isContentPurchaseInProgress,
  usePayExtraPresets,
  PurchaseContentPage
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import { Flex } from '@audius/harmony'
import {
  IconCart,
  ModalContentPages,
  ModalFooter,
  ModalHeader
} from '@audius/stems'
import cn from 'classnames'
import { Formik, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Icon } from 'components/Icon'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { Text } from 'components/typography'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import { pushUniqueRoute } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './PremiumContentPurchaseModal.module.css'
import { AudioMatchSection } from './components/AudioMatchSection'
import { PurchaseContentFormFields } from './components/PurchaseContentFormFields'
import { PurchaseContentFormFooter } from './components/PurchaseContentFormFooter'
import { usePurchaseContentFormState } from './hooks/usePurchaseContentFormState'
import { useHistoryContext } from 'app/HistoryProvider'

const { startRecoveryIfNecessary, cleanup: cleanupUSDCRecovery } =
  buyUSDCActions
const { cleanup, setPurchasePage } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const messages = {
  completePurchase: 'Complete Purchase'
}

const pageToPageIndex = (page: PurchaseContentPage) => {
  switch (page) {
    case PurchaseContentPage.PURCHASE:
      return 0
    case PurchaseContentPage.TRANSFER:
      return 1
  }
}

// The bulk of the form rendering is in a nested component because we want access
// to the FormikContext, which can only be used in a component which is a descendant
// of the `<Formik />` component
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
  const { error, isUnlocking, purchaseSummaryValues, stage, page } =
    usePurchaseContentFormState({ price })
  const currentPageIndex = pageToPageIndex(page)

  const { resetForm } = useFormikContext()
  const { history } = useHistoryContext()

  // Reset form on track change
  useEffect(() => resetForm, [track.track_id, resetForm])

  // Navigate to track on successful purchase behind the modal
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH && permalink) {
      dispatch(pushUniqueRoute(history.location, permalink))
    }
  }, [stage, permalink, dispatch, history])

  const handleClose = useCallback(() => {
    dispatch(setPurchasePage({ page: PurchaseContentPage.PURCHASE }))
  }, [dispatch])

  const mobile = isMobile()

  return (
    <ModalForm>
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: mobile })}
        onClose={onClose}
        showDismissButton={!mobile}
      >
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
      <ModalContentPages
        contentClassName={styles.content}
        className={styles.content}
        currentPage={currentPageIndex}
      >
        <>
          {stage !== PurchaseContentStage.FINISH ? (
            <AudioMatchSection
              amount={USDC(price / 100)
                .round()
                .toShorthand()}
            />
          ) : null}
          <Flex p={mobile ? 'l' : 'xl'}>
            <Flex direction='column' gap='xl' w='100%'>
              <LockedTrackDetailsTile
                track={track as unknown as Track}
                owner={track.user}
              />
              <PurchaseContentFormFields
                stage={stage}
                purchaseSummaryValues={purchaseSummaryValues}
                isUnlocking={isUnlocking}
                price={price}
              />
            </Flex>
          </Flex>
        </>
        <USDCManualTransfer onClose={handleClose} amountInCents={price} />
      </ModalContentPages>
      <ModalFooter className={styles.footer}>
        {page === PurchaseContentPage.PURCHASE ? (
          <PurchaseContentFormFooter
            error={error}
            isUnlocking={isUnlocking}
            onViewTrackClicked={onClose}
            purchaseSummaryValues={purchaseSummaryValues}
            stage={stage}
            track={track}
          />
        ) : null}
      </ModalFooter>
    </ModalForm>
  )
}

export const PremiumContentPurchaseModal = () => {
  const dispatch = useDispatch()
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId: trackId }
  } = usePremiumContentPurchaseModal()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const presetValues = usePayExtraPresets()

  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const isValidTrack = track && isTrackPurchasable(track)
  const price = isValidTrack
    ? track?.premium_conditions?.usdc_purchase?.price
    : 0
  const { initialValues, validationSchema, onSubmit } =
    usePurchaseContentFormConfiguration({
      track,
      price,
      presetValues
    })

  // Attempt recovery once on re-mount of the form
  useEffect(() => {
    dispatch(startRecoveryIfNecessary)
  }, [dispatch])

  const handleClose = useCallback(() => {
    // Don't allow closing if we're in the middle of a purchase
    if (!isUnlocking) {
      onClose()
    }
  }, [isUnlocking, onClose])

  const handleClosed = useCallback(() => {
    onClosed()
    dispatch(cleanup())
    dispatch(cleanupUSDCRecovery())
  }, [onClosed, dispatch])

  if (track && !isValidTrack) {
    console.error('PremiumContentPurchaseModal: Track is not purchasable')
  }
  const mobile = isMobile()

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={handleClosed}
      bodyClassName={styles.modal}
      isFullscreen
      useGradientTitle={false}
      dismissOnClickOutside
      zIndex={zIndex.PREMIUM_CONTENT_PURCHASE_MODAL}
      wrapperClassName={mobile ? styles.mobileWrapper : undefined}
    >
      {isValidTrack ? (
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(validationSchema)}
          onSubmit={onSubmit}
        >
          <RenderForm track={track} onClose={handleClose} />
        </Formik>
      ) : null}
    </ModalDrawer>
  )
}
