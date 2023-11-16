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
  useUSDCBalance,
  statusIsNotFinalized
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import { Flex } from '@audius/harmony'
import { IconCart, ModalContent, ModalFooter, ModalHeader } from '@audius/stems'
import cn from 'classnames'
import { Formik, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { Text } from 'components/typography'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import { pushUniqueRoute } from 'utils/route'

import styles from './PremiumContentPurchaseModal.module.css'
import { AudioMatchSection } from './components/AudioMatchSection'
import { PurchaseContentFormFields } from './components/PurchaseContentFormFields'
import { PurchaseContentFormFooter } from './components/PurchaseContentFormFooter'
import { usePurchaseContentFormState } from './hooks/usePurchaseContentFormState'

const { startRecoveryIfNecessary, cleanup: cleanupUSDCRecovery } =
  buyUSDCActions
const { cleanup } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const messages = {
  completePurchase: 'Complete Purchase'
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
      usdc_purchase: { price: priceCents }
    }
  } = track
  const price = USDC(priceCents / 100)
  const { error, isUnlocking, purchaseSummaryValues, stage } =
    usePurchaseContentFormState({ price: priceCents })

  const { resetForm } = useFormikContext()

  // Reset form on track change
  useEffect(() => resetForm, [track.track_id, resetForm])

  // Navigate to track on successful purchase behind the modal
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH && permalink) {
      dispatch(pushUniqueRoute(permalink))
    }
  }, [stage, permalink, dispatch])

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
      <ModalContent className={styles.content}>
        {stage !== PurchaseContentStage.FINISH ? (
          <AudioMatchSection amount={price.round().toShorthand()} />
        ) : null}
        <Flex p='xl'>
          <Flex direction='column' gap='xl' w='100%'>
            <LockedTrackDetailsTile
              track={track as unknown as Track}
              owner={track.user}
            />
            <PurchaseContentFormFields
              stage={stage}
              purchaseSummaryValues={purchaseSummaryValues}
              isUnlocking={isUnlocking}
              price={Number(price.value) / 10 ** price.decimalPlaces}
            />
          </Flex>
        </Flex>
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
  const presetValues = usePayExtraPresets(useRemoteVar)
  // Fetch USDC balance here so that initialValues takes it into account
  const { balanceStatus } = useUSDCBalance()
  const isLoading = statusIsNotFinalized(balanceStatus)

  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  useEffect(() => {
    console.debug('Modal mounted')
    return () => {
      console.debug('modal unmounted')
    }
  })

  const isValidTrack = track && isTrackPurchasable(track)
  const price = isValidTrack
    ? USDC(track?.premium_conditions?.usdc_purchase?.price / 100)
    : USDC(0)
  const { initialValues, validationSchema, onSubmit } =
    usePurchaseContentFormConfiguration({
      track,
      price: price.value,
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

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={handleClosed}
      bodyClassName={styles.modal}
      isFullscreen
      useGradientTitle={false}
      dismissOnClickOutside
    >
      {isLoading ? (
        <Flex
          alignItems='center'
          justifyContent='center'
          h='100%'
          css={{ flexGrow: 1 }}
        >
          <LoadingSpinner className={styles.spinner} />
        </Flex>
      ) : isValidTrack ? (
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
