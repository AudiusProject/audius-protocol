import { useCallback, useEffect } from 'react'

import {
  PURCHASE_METHOD,
  PurchaseableContentMetadata
} from '@audius/common/hooks'
import {
  ID,
  PurchaseMethod,
  USDCPurchaseConditions
} from '@audius/common/models'
import {
  purchaseContentActions,
  PurchaseContentStage,
  PurchaseContentPage
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
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'

import { useHistoryContext } from 'app/HistoryProvider'
import { GuestCheckout } from 'components/guest-checkout/GuestCheckout'
import { ModalForm } from 'components/modal-form/ModalForm'
import { LockedContentDetailsTile } from 'components/track/LockedContentDetailsTile'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import { useIsMobile } from 'hooks/useIsMobile'
import { pushUniqueRoute } from 'utils/route'

import styles from '../PremiumContentPurchaseModal.module.css'
import { usePurchaseContentFormState } from '../hooks/usePurchaseContentFormState'
import { PurchaseContentPage } from '../pages/PurchaseContentPage'

import { PurchaseContentFormFooter } from './PurchaseContentFormFooter'

const { setPurchasePage } = purchaseContentActions

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

type PremiumContentPurchaseFormProps = {
  onClose: () => void
  metadata: PurchaseableContentMetadata
  purchaseConditions: USDCPurchaseConditions
  contentId: ID
}

export const PremiumContentPurchaseForm = (
  props: PremiumContentPurchaseFormProps
) => {
  const { onClose, metadata, purchaseConditions, contentId } = props
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
              <PurchaseContentPage
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
