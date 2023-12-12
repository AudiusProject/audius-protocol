import { useCallback, useState } from 'react'

import {
  useAddFundsModal,
  buyUSDCActions,
  PurchaseMethod,
  DEFAULT_PURCHASE_AMOUNT_CENTS,
  PurchaseVendor
} from '@audius/common'
import { ModalContent, ModalHeader } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { AddFunds } from 'components/add-funds/AddFunds'
import { Text } from 'components/typography'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { isMobile } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

import styles from './AddFundsModal.module.css'

const messages = {
  addFunds: 'Add Funds',
  cryptoTransfer: 'Crypto Transfer'
}

type Page = 'add-funds' | 'crypto-transfer'

export const AddFundsModal = () => {
  const { isOpen, onClose } = useAddFundsModal()
  const dispatch = useDispatch()
  const mobile = isMobile()

  const [page, setPage] = useState<Page>('add-funds')

  const handleClosed = useCallback(() => {
    setPage('add-funds')
  }, [setPage])

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
      dismissOnClickOutside
      isFullscreen={false}
    >
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
          {page === 'add-funds' ? messages.addFunds : messages.cryptoTransfer}
        </Text>
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
