import { useCallback, useEffect } from 'react'

import {
  useGetCurrentUser,
  useGetCurrentUserId,
  useGetPlaylistById,
  useGetTrackById,
  useGetUserById
} from '@audius/common/api'
import {
  useFeatureFlag,
  usePurchaseContentFormConfiguration,
  usePayExtraPresets,
  isStreamPurchaseable,
  isTrackDownloadPurchaseable,
  PURCHASE_METHOD,
  PurchaseableContentMetadata
} from '@audius/common/hooks'
import {
  ID,
  PurchaseMethod,
  PurchaseVendor,
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
  isContentPurchaseInProgress,
  PurchaseableContentType
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import {
  ModalContentPages,
  ModalHeader,
  ModalFooter,
  Flex,
  IconCart,
  ModalTitle
} from '@audius/harmony'
import cn from 'classnames'
import { Formik, useField, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useHistoryContext } from 'app/HistoryProvider'
import { GuestCheckout } from 'components/guest-checkout/GuestCheckout'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedContentDetailsTile } from 'components/track/LockedContentDetailsTile'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import { useManagedAccountNotAllowedCallback } from 'hooks/useManagedAccountNotAllowedRedirect'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { pushUniqueRoute } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './PremiumContentPurchaseModal.module.css'
import { PurchaseContentFormFields } from './components/PurchaseContentFormFields'
import { PurchaseContentFormFooter } from './components/PurchaseContentFormFooter'
import { usePurchaseContentFormState } from './hooks/usePurchaseContentFormState'

const { startRecoveryIfNecessary, cleanup: cleanupUSDCRecovery } =
  buyUSDCActions
const { cleanup, setPurchasePage, eagerCreateUserBank } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const messages = {
  completePurchase: 'Complete Purchase'
}

const pageToPageIndex = (page: PurchaseContentPage) => {
  switch (page) {
    case PurchaseContentPage.GUEST_CHECKOUT:
      return 0
    case PurchaseContentPage.PURCHASE:
      return 1
    case PurchaseContentPage.TRANSFER:
      return 2
  }
}

// The bulk of the form rendering is in a nested component because we want access
// to the FormikContext, which can only be used in a component which is a descendant
// of the `<Formik />` component
const RenderForm = ({
  onClose,
  metadata,
  purchaseConditions,
  contentId
}: {
  onClose: () => void
  metadata: PurchaseableContentMetadata
  purchaseConditions: USDCPurchaseConditions
  contentId: ID
}) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const { permalink } = metadata
  const {
    usdc_purchase: { price }
  } = purchaseConditions
  const { error, isUnlocking, purchaseSummaryValues, stage, page } =
    usePurchaseContentFormState({ price })
  const [, , { setValue: setPurchaseMethod }] = useField(PURCHASE_METHOD)
  const currentPageIndex = pageToPageIndex(page)
  const isLinkDisabled =
    stage === PurchaseContentStage.START ||
    stage === PurchaseContentStage.PURCHASING ||
    stage === PurchaseContentStage.CONFIRMING_PURCHASE

  const { submitForm, resetForm } = useFormikContext()
  const { history } = useHistoryContext()

  // Reset form on track change
  useEffect(() => {
    resetForm()
  }, [contentId, resetForm])

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
        <ModalTitle icon={<IconCart />} title={messages.completePurchase} />
      </ModalHeader>
      <ModalContentPages
        contentClassName={styles.content}
        className={styles.content}
        currentPage={currentPageIndex}
      >
        <GuestCheckout
          metadata={metadata}
          price={price}
          onClickSignIn={onClose}
        />
        <>
          <Flex p={isMobile ? 'l' : 'xl'} pb='m'>
            <Flex direction='column' gap='xl' w='100%'>
              <LockedContentDetailsTile
                showLabel={false}
                metadata={metadata}
                owner={metadata.user}
                disabled={isLinkDisabled}
                earnAmount={USDC(price / 100)
                  .round()
                  .toShorthand()}
              />
              <PurchaseContentFormFields
                stage={stage}
                purchaseSummaryValues={purchaseSummaryValues}
                isUnlocking={isUnlocking}
                price={price}
                metadata={metadata}
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
            onViewContentClicked={onClose}
            purchaseSummaryValues={purchaseSummaryValues}
            stage={stage}
            metadata={metadata}
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
    data: { contentId, contentType }
  } = usePremiumContentPurchaseModal()
  const { isEnabled: isCoinflowEnabled, isLoaded: isCoinflowEnabledLoaded } =
    useFeatureFlag(FeatureFlags.BUY_WITH_COINFLOW)
  const isUSDCEnabled = useIsUSDCEnabled()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const presetValues = usePayExtraPresets()
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: currentUser } = useGetCurrentUser({})
  const { isEnabled: guestCheckoutEnabled = false } = useFeatureFlag(
    FeatureFlags.GUEST_CHECKOUT
  )

  const isAlbum = contentType === PurchaseableContentType.ALBUM
  const { data: track } = useGetTrackById(
    { id: contentId! },
    { disabled: isAlbum || !contentId }
  )

  const { data: album } = useGetPlaylistById(
    { playlistId: contentId!, currentUserId },
    { disabled: !isAlbum || !contentId }
  )

  const { data: user } = useGetUserById(
    {
      id: track?.owner_id ?? album?.playlist_owner_id ?? 0,
      currentUserId
    },
    { disabled: !(track?.owner_id && album?.playlist_owner_id) }
  )
  const metadata = {
    ...(isAlbum ? album : track),
    user
  } as PurchaseableContentMetadata

  const isValidStreamGated = !!metadata && isStreamPurchaseable(metadata)
  const isValidDownloadGated =
    !!metadata && isTrackDownloadPurchaseable(metadata)

  const purchaseConditions = isValidStreamGated
    ? metadata.stream_conditions
    : isValidDownloadGated
    ? metadata.download_conditions
    : null

  const price = purchaseConditions ? purchaseConditions?.usdc_purchase.price : 0

  const { initialValues, validationSchema, onSubmit } =
    usePurchaseContentFormConfiguration({
      metadata,
      price,
      presetValues,
      purchaseVendor: isCoinflowEnabled
        ? PurchaseVendor.COINFLOW
        : PurchaseVendor.STRIPE
    })
  const showGuestCheckout =
    guestCheckoutEnabled &&
    (!currentUser || (currentUser && !currentUser.handle)) &&
    initialValues.guestEmail === ''
  if (showGuestCheckout) {
    dispatch(setPurchasePage({ page: PurchaseContentPage.GUEST_CHECKOUT }))
  }

  // On form mount, pre-create user bank if needed and check for any usdc stuck
  // in root wallet from an aborted withdrawal
  useEffect(() => {
    dispatch(eagerCreateUserBank())
    dispatch(startRecoveryIfNecessary())
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

  useManagedAccountNotAllowedCallback({
    trigger: isOpen,
    callback: handleClose
  })

  if (
    !metadata ||
    !purchaseConditions ||
    !(isValidDownloadGated || isValidStreamGated)
  ) {
    console.error('PremiumContentPurchaseModal: Content is not purchasable')
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
          enableReinitialize
          validationSchema={toFormikValidationSchema(validationSchema)}
          onSubmit={onSubmit}
        >
          <RenderForm
            contentId={contentId}
            metadata={metadata}
            onClose={handleClose}
            purchaseConditions={purchaseConditions}
          />
        </Formik>
      ) : null}
    </ModalDrawer>
  )
}
