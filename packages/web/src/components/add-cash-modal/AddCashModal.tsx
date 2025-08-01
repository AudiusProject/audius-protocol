import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_PURCHASE_AMOUNT_CENTS } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import {
  buyUSDCActions,
  buyUSDCSelectors,
  BuyUSDCStage,
  useAddCashModal
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { AddCash } from 'components/add-cash/AddCash'
import { ResponsiveModal } from 'components/modal'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import { useIsMobile } from 'hooks/useIsMobile'
import zIndex from 'utils/zIndex'

const { getBuyUSDCFlowStage } = buyUSDCSelectors

type Page = 'add-cash' | 'crypto-transfer'

export const AddCashModal = () => {
  const { isOpen, onClose } = useAddCashModal()
  const dispatch = useDispatch()
  const buyUSDCStage = useSelector(getBuyUSDCFlowStage)
  const inProgress = [
    BuyUSDCStage.PURCHASING,
    BuyUSDCStage.CONFIRMING_PURCHASE
  ].includes(buyUSDCStage)
  const isMobile = useIsMobile()

  const [page, setPage] = useState<Page>('add-cash')

  const handleClosed = useCallback(() => {
    setPage('add-cash')
  }, [setPage])

  useEffect(() => {
    // Close modal if the buy USDC stage flips to finish
    if (buyUSDCStage === BuyUSDCStage.FINISH) {
      onClose()
    }
  }, [buyUSDCStage, onClose])

  const handleContinue = useCallback(
    (purchaseMethod: PurchaseMethod, purchaseVendor?: PurchaseVendor) => {
      switch (purchaseMethod) {
        case PurchaseMethod.CRYPTO:
          setPage('crypto-transfer')
          break
        case PurchaseMethod.CARD: {
          dispatch(
            buyUSDCActions.onrampOpened({
              vendor: purchaseVendor || PurchaseVendor.STRIPE,
              purchaseInfo: {
                desiredAmount: DEFAULT_PURCHASE_AMOUNT_CENTS
              }
            })
          )
          break
        }
        case PurchaseMethod.BALANCE:
          throw new Error('Add cash not supported with existing balance')
      }
    },
    [setPage, dispatch]
  )

  return (
    <ResponsiveModal
      zIndex={zIndex.ADD_FUNDS_MODAL}
      size='m'
      onClose={onClose}
      isOpen={isOpen}
      onClosed={handleClosed}
      dismissOnClickOutside={!inProgress}
      isFullscreen={false}
      title={
        page === 'add-cash'
          ? walletMessages.addCash
          : walletMessages.usdcTransfer
      }
      showDismissButton={!isMobile}
    >
      {page === 'add-cash' ? (
        <AddCash onContinue={handleContinue} />
      ) : (
        <USDCManualTransfer onClose={onClose} />
      )}
    </ResponsiveModal>
  )
}
