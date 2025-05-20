import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_PURCHASE_AMOUNT_CENTS } from '@audius/common/hooks'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import {
  buyUSDCActions,
  buyUSDCSelectors,
  BuyUSDCStage,
  useAddCashModal
} from '@audius/common/store'
import {
  ModalContent,
  ModalHeader,
  ModalTitle,
  Flex,
  Text,
  IconLogoLinkByStripe
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { AddCash } from 'components/add-cash/AddCash'
import ModalDrawer from 'components/modal-drawer/ModalDrawer'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import { useIsMobile } from 'hooks/useIsMobile'
import zIndex from 'utils/zIndex'

import styles from './AddCashModal.module.css'

const { getBuyUSDCFlowStage } = buyUSDCSelectors

const messages = {
  addCash: 'Add Cash',
  cryptoTransfer: 'Crypto Transfer',
  poweredBy: 'Powered by'
}

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
    <ModalDrawer
      zIndex={zIndex.ADD_FUNDS_MODAL}
      size={'small'}
      onClose={onClose}
      isOpen={isOpen}
      onClosed={handleClosed}
      bodyClassName={styles.modal}
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
            page === 'add-cash' ? messages.addCash : messages.cryptoTransfer
          }
        />
      </ModalHeader>
      <ModalContent className={styles.noPadding}>
        {page === 'add-cash' ? (
          <AddCash onContinue={handleContinue} />
        ) : (
          <USDCManualTransfer onClose={onClose} />
        )}
      </ModalContent>
      {page === 'add-cash' && (
        <Flex
          justifyContent='center'
          alignItems='center'
          gap='m'
          borderTop='default'
          backgroundColor='surface1'
          pv='2xs'
        >
          <Text variant='label' size='s' color='subdued'>
            {messages.poweredBy}
          </Text>
          <IconLogoLinkByStripe width={100} color='subdued' />
        </Flex>
      )}
    </ModalDrawer>
  )
}
