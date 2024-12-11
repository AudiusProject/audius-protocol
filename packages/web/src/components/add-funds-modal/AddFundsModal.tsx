import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_PURCHASE_AMOUNT_CENTS } from '@audius/common/hooks'
import {
  ErrorLevel,
  PurchaseMethod,
  PurchaseVendor
} from '@audius/common/models'
import {
  buyUSDCActions,
  buyUSDCSelectors,
  BuyUSDCStage,
  useAddFundsModal
} from '@audius/common/store'
import { ModalContent, ModalHeader, ModalTitle } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { AddFunds } from 'components/add-funds/AddFunds'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import { useIsMobile } from 'hooks/useIsMobile'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { authService } from 'services/audius-sdk'
import { reportToSentry } from 'store/errors/reportToSentry'
import zIndex from 'utils/zIndex'

import styles from './AddFundsModal.module.css'

const { getBuyUSDCFlowStage } = buyUSDCSelectors

const messages = {
  addFunds: 'Add Funds',
  cryptoTransfer: 'Crypto Transfer'
}

type Page = 'add-funds' | 'crypto-transfer'

export const AddFundsModal = () => {
  const { isOpen, onClose } = useAddFundsModal()
  const dispatch = useDispatch()
  const buyUSDCStage = useSelector(getBuyUSDCFlowStage)
  const inProgress = [
    BuyUSDCStage.PURCHASING,
    BuyUSDCStage.CONFIRMING_PURCHASE
  ].includes(buyUSDCStage)
  const isMobile = useIsMobile()

  const [page, setPage] = useState<Page>('add-funds')

  const handleClosed = useCallback(() => {
    setPage('add-funds')
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
          const privateKey = authService.getWallet()?.getPrivateKey()
          if (!privateKey) {
            reportToSentry({
              level: ErrorLevel.Error,
              error: new Error('No private key found in add funds modal')
            })
            return
          }
          dispatch(
            buyUSDCActions.onrampOpened({
              vendor: purchaseVendor || PurchaseVendor.STRIPE,
              purchaseInfo: {
                desiredAmount: DEFAULT_PURCHASE_AMOUNT_CENTS
              },
              privateKey
            })
          )
          break
        }
        case PurchaseMethod.BALANCE:
          throw new Error('Add funds not supported with existing balance')
      }
    },
    [setPage, dispatch]
  )

  return (
    <ModalDrawer
      zIndex={zIndex.ADD_FUNDS_MODAL}
      size={'small'}
      onClose={onClose}
      isOpen={isOpen}
      onClosed={handleClosed}
      bodyClassName={styles.modal}
      useGradientTitle={false}
      dismissOnClickOutside={!inProgress}
      isFullscreen={false}
    >
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: isMobile })}
        onClose={onClose}
        showDismissButton={!isMobile}
      >
        <ModalTitle
          title={
            page === 'add-funds' ? messages.addFunds : messages.cryptoTransfer
          }
        />
      </ModalHeader>
      <ModalContent className={styles.noPadding}>
        {page === 'add-funds' ? (
          <AddFunds onContinue={handleContinue} />
        ) : (
          <USDCManualTransfer onClose={() => setPage('add-funds')} />
        )}
      </ModalContent>
    </ModalDrawer>
  )
}
