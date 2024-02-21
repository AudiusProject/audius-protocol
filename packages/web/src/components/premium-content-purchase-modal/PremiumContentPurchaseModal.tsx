import { useCallback, useEffect } from 'react'

import { useGetTrackById } from '@audius/common/api'
import {
  useFeatureFlag,
  usePurchaseContentFormConfiguration,
  usePayExtraPresets,
  isTrackStreamPurchaseable,
  isTrackDownloadPurchaseable,
  PurchaseableTrackMetadata,
  PURCHASE_METHOD
} from '@audius/common/hooks'
import {
  PurchaseMethod,
  PurchaseVendor,
  Track,
  USDCPurchaseConditions
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  buyUSDCActions,
  usePremiumContentPurchaseModal,
  purchaseContentActions,
  purchaseContentSelectors,
  PurchaseContentStage,
  PurchaseContentPage,
  isContentPurchaseInProgress
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import {
  ModalContentPages,
  ModalHeader,
  ModalFooter,
  Flex,
  IconCart,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { Formik, useField, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useHistoryContext } from 'app/HistoryProvider'
import { Icon } from 'components/Icon'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedTrackDetailsTile } from 'components/track/LockedTrackDetailsTile'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { pushUniqueRoute } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './PremiumContentPurchaseModal.module.css'
import { AudioMatchSection } from './components/AudioMatchSection'
import { PurchaseContentFormFields } from './components/PurchaseContentFormFields'
import { PurchaseContentFormFooter } from './components/PurchaseContentFormFooter'
import { usePurchaseContentFormState } from './hooks/usePurchaseContentFormState'

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
  track,
  purchaseConditions
}: {
  onClose: () => void
  track: PurchaseableTrackMetadata
  purchaseConditions: USDCPurchaseConditions
}) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const { permalink } = track
  const {
    usdc_purchase: { price }
  } = purchaseConditions
  const { error, isUnlocking, purchaseSummaryValues, stage, page } =
    usePurchaseContentFormState({ price })
  const [, , { setValue: setPurchaseMethod }] = useField(PURCHASE_METHOD)
  const currentPageIndex = pageToPageIndex(page)

  const { submitForm, resetForm } = useFormikContext()
  const { history } = useHistoryContext()

  // Reset form on track change
  useEffect(() => resetForm, [track.track_id, resetForm])

  // Navigate to track on successful purchase behind the modal
  useEffect(() => {
    if (stage === PurchaseContentStage.FINISH && permalink) {
      dispatch(pushUniqueRoute(history.location, permalink))
    }
  }, [stage, permalink, dispatch, history])

  const handleUSDCManualTransferClose = useCallback(() => {
    dispatch(setPurchasePage({ page: PurchaseContentPage.PURCHASE }))
  }, [dispatch])

  const handleUSDCManualTransferPurchase = useCallback(() => {
    setPurchaseMethod(PurchaseMethod.BALANCE)
    submitForm()
  }, [submitForm, setPurchaseMethod])

  return (
    <ModalForm className={cn(styles.modalRoot, { [styles.mobile]: isMobile })}>
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: isMobile })}
        onClose={onClose}
        showDismissButton={!isMobile}
      >
        <Text
          variant='label'
          color='subdued'
          size='xl'
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
          <Flex p={isMobile ? 'l' : 'xl'}>
            <Flex direction='column' gap='xl' w='100%'>
              <LockedTrackDetailsTile
                showLabel={false}
                track={track as unknown as Track}
                owner={track.user}
              />
              <PurchaseContentFormFields
                stage={stage}
                purchaseSummaryValues={purchaseSummaryValues}
                isUnlocking={isUnlocking}
                price={price}
                track={track}
              />
            </Flex>
          </Flex>
        </>
        <USDCManualTransfer
          onClose={handleUSDCManualTransferClose}
          amountInCents={price}
          onPurchase={handleUSDCManualTransferPurchase}
        />
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
  const isMobile = useIsMobile()
  const {
    isOpen,
    onClose,
    onClosed,
    data: { contentId: trackId }
  } = usePremiumContentPurchaseModal()
  const { isEnabled: isCoinflowEnabled, isLoaded: isCoinflowEnabledLoaded } =
    useFeatureFlag(FeatureFlags.BUY_WITH_COINFLOW)
  const isUSDCEnabled = useIsUSDCEnabled()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const presetValues = usePayExtraPresets()

  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const isValidStreamGatedTrack = !!track && isTrackStreamPurchaseable(track)
  const isValidDownloadGatedTrack =
    !!track && isTrackDownloadPurchaseable(track)

  const purchaseConditions = isValidStreamGatedTrack
    ? track.stream_conditions
    : isValidDownloadGatedTrack
    ? track.download_conditions
    : null

  const price = purchaseConditions ? purchaseConditions?.usdc_purchase.price : 0

  const { initialValues, validationSchema, onSubmit } =
    usePurchaseContentFormConfiguration({
      track,
      price,
      presetValues,
      purchaseVendor: isCoinflowEnabled
        ? PurchaseVendor.COINFLOW
        : PurchaseVendor.STRIPE
    })

  // Attempt recovery once on re-mount of the form
  useEffect(() => {
    dispatch(startRecoveryIfNecessary)
  }, [dispatch])

  const handleClose = useCallback(() => {
    // Don't allow closing if we're in the middle of a purchase
    if (!isUnlocking || stage === PurchaseContentStage.START) {
      onClose()
    }
  }, [isUnlocking, stage, onClose])

  const handleClosed = useCallback(() => {
    onClosed()
    dispatch(cleanup())
    dispatch(cleanupUSDCRecovery())
  }, [onClosed, dispatch])

  if (
    !track ||
    !purchaseConditions ||
    !(isValidDownloadGatedTrack || isValidStreamGatedTrack)
  ) {
    console.error('PremiumContentPurchaseModal: Track is not purchasable')
    return null
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
      zIndex={zIndex.PREMIUM_CONTENT_PURCHASE_MODAL}
      wrapperClassName={isMobile ? styles.mobileWrapper : undefined}
    >
      {isCoinflowEnabledLoaded && isUSDCEnabled ? (
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(validationSchema)}
          onSubmit={onSubmit}
        >
          <RenderForm
            track={track}
            onClose={handleClose}
            purchaseConditions={purchaseConditions}
          />
        </Formik>
      ) : null}
    </ModalDrawer>
  )
}
