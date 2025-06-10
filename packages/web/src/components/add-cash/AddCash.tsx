import { useState } from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { PurchaseMethod, PurchaseVendor } from '@audius/common/models'
import { BuyUSDCStage, buyUSDCSelectors } from '@audius/common/store'
import { Button, Flex, Text, IconLogoLinkByStripe } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { ResponsiveModalContent } from 'components/modal'
import { PaymentMethod } from 'components/payment-method/PaymentMethod'
import { useIsMobile } from 'hooks/useIsMobile'
import { track } from 'services/analytics'

import { CashBalanceSection } from './CashBalanceSection'

const { getBuyUSDCFlowStage } = buyUSDCSelectors

const messages = {
  purchasing: 'Purchasing',
  continue: 'Continue'
}

const PoweredBySection = () => (
  <Flex
    justifyContent='center'
    alignItems='center'
    gap='m'
    borderTop='default'
    backgroundColor='surface1'
    pv='2xs'
  >
    <Text variant='label' size='s' color='subdued'>
      {walletMessages.poweredBy}
    </Text>
    <IconLogoLinkByStripe width={100} color='subdued' />
  </Flex>
)

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
    <Flex column>
      {isMobile && <PoweredBySection />}
      <ResponsiveModalContent gap='xl'>
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
      </ResponsiveModalContent>
      {!isMobile && <PoweredBySection />}
    </Flex>
  )
}
