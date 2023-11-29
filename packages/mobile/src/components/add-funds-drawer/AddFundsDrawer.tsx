import { useCallback, useState } from 'react'

import {
  useAddFundsModal,
  useUSDCManualTransferModal,
  buyUSDCActions,
  USDCOnRampProvider,
  PurchaseMethod,
  PurchaseVendor,
  DEFAULT_PURCHASE_AMOUNT_CENTS
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Text } from 'app/components/core'
import Drawer from 'app/components/drawer'
import { getPurchaseVendor } from 'app/store/purchase-vendor/selectors'
import { reset as resetPurchaseMethod } from 'app/store/purchase-vendor/slice'
import { flexRowCentered, makeStyles } from 'app/styles'

import { PaymentMethod } from '../payment-method/PaymentMethod'
import { USDCBalanceRow } from '../usdc-balance-row/USDCBalanceRow'

const messages = {
  title: 'Add Funds',
  continue: 'Continue'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  drawer: {
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(4),
    gap: spacing(6)
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    paddingBottom: spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  }
}))

export const AddFundsDrawer = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const purchaseVendorState = useSelector(getPurchaseVendor)
  const { isOpen, onClose, onClosed } = useAddFundsModal()
  const { onOpen: openUSDCManualTransferModal } = useUSDCManualTransferModal()

  const [selectedPurchaseMethod, setSelectedPurchaseMethod] =
    useState<PurchaseMethod>(PurchaseMethod.CARD)

  const openCardFlow = useCallback(() => {
    switch (purchaseVendorState) {
      case PurchaseVendor.STRIPE:
        dispatch(
          buyUSDCActions.onrampOpened({
            provider: USDCOnRampProvider.STRIPE,
            purchaseInfo: {
              desiredAmount: DEFAULT_PURCHASE_AMOUNT_CENTS
            }
          })
        )
        break
    }
  }, [dispatch, purchaseVendorState])

  const onContinuePress = useCallback(() => {
    if (selectedPurchaseMethod === PurchaseMethod.CARD) {
      openCardFlow()
    } else if (selectedPurchaseMethod === PurchaseMethod.CRYPTO) {
      openUSDCManualTransferModal()
    }
  }, [selectedPurchaseMethod, openCardFlow, openUSDCManualTransferModal])

  const handleClose = useCallback(() => {
    dispatch(resetPurchaseMethod())
    onClose()
  }, [dispatch, onClose])

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} onClosed={onClosed}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <Text
            variant='label'
            weight='heavy'
            color='neutralLight2'
            fontSize='xl'
            textTransform='uppercase'
          >
            {messages.title}
          </Text>
        </View>
        <USDCBalanceRow />
        <PaymentMethod
          selectedType={selectedPurchaseMethod}
          setSelectedType={setSelectedPurchaseMethod}
        />
        <Button
          title={messages.continue}
          onPress={onContinuePress}
          size='large'
          fullWidth
        />
      </View>
    </Drawer>
  )
}
