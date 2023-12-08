import { useCallback, useMemo } from 'react'

import { PurchaseVendor } from '@audius/common'
import { useDispatch } from 'react-redux'

import { setPurchaseVendor } from 'app/store/purchase-vendor/slice'

import ActionDrawer from '../action-drawer'

const MODAL_NAME = 'PurchaseVendor'

const messages = {
  stripe: 'Stripe'
}
export const PurchaseVendorDrawer = () => {
  const dispatch = useDispatch()

  const handleSelect = useCallback(
    (vendor: PurchaseVendor) => {
      dispatch(setPurchaseVendor(vendor))
    },
    [dispatch]
  )

  const rows = useMemo(
    () => [
      {
        text: messages.stripe,
        callback: () => handleSelect(PurchaseVendor.STRIPE)
      }
    ],
    [handleSelect]
  )

  return <ActionDrawer modalName={MODAL_NAME} rows={rows} />
}
