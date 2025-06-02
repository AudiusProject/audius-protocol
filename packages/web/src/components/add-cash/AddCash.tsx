import { useState } from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import { BuyUSDCStage, buyUSDCSelectors } from '@audius/common/store'
import { Button, Flex } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { PaymentMethod } from 'components/payment-method/PaymentMethod'
import { useIsMobile } from 'hooks/useIsMobile'
import { track } from 'services/analytics'

import styles from './AddCash.module.css'
import { CashBalanceSection } from './CashBalanceSection'

const { getBuyUSDCFlowStage } = buyUSDCSelectors

const messages = {
  purchasing: 'Purchasing',
  continue: 'Continue'
}

export const AddCash = ({
  onContinue
}: {
  onContinue: (
    purchaseMethod: PurchaseMethod,
    purchaseVendor?: PurchaseVendor
  ) => void
}) => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    mint: 'USDC'
  })
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] =
    useState<PurchaseMethod>(PurchaseMethod.CARD)
  const [selectedPurchaseVendor, setSelectedPurchaseVendor] = useState<
    PurchaseVendor | undefined
  >(undefined)

  const isMobile = useIsMobile()
  const { data: balanceBN } = useUSDCBalance({
    isPolling: true,
    commitment: 'confirmed'
  })

  const buyUSDCStage = useSelector(getBuyUSDCFlowStage)
  const inProgress = [
    BuyUSDCStage.PURCHASING,
    BuyUSDCStage.CONFIRMING_PURCHASE
  ].includes(buyUSDCStage)

  return (
    <Flex className={styles.root}>
      <Flex
        className={cn(styles.buttonContainer, {
          [styles.mobile]: isMobile
        })}
      >
        <Flex column w='100%' gap='xl' p='xl'>
          <CashBalanceSection balance={balanceBN} />
          <PaymentMethod
            showVendorChoice
            showExtraItemsToggle={false}
            selectedVendor={selectedPurchaseVendor ?? null}
            selectedMethod={selectedPurchaseMethod}
            setSelectedMethod={setSelectedPurchaseMethod}
            setSelectedVendor={setSelectedPurchaseVendor}
          />
          <Button
            variant='primary'
            fullWidth
            onClick={() =>
              onContinue(selectedPurchaseMethod, selectedPurchaseVendor)
            }
            isLoading={inProgress}
            disabled={inProgress}
          >
            {inProgress ? messages.purchasing : messages.continue}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
