import { useCallback, useMemo } from 'react'

import { FeatureFlags, PurchaseVendor, useFeatureFlag } from '@audius/common'
import { useDispatch } from 'react-redux'

import { setPurchaseVendor } from 'app/store/purchase-vendor/slice'

import ActionDrawer from '../action-drawer'

const MODAL_NAME = 'PurchaseVendor'

export const PurchaseVendorDrawer = () => {
  const dispatch = useDispatch()
  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.BUY_WITH_COINFLOW
  )

  const handleSelect = useCallback(
    (vendor: PurchaseVendor) => {
      dispatch(setPurchaseVendor(vendor))
    },
    [dispatch]
  )

  const rows = useMemo(
    () => [
      ...(isCoinflowEnabled
        ? [
            {
              text: PurchaseVendor.COINFLOW,
              callback: () => handleSelect(PurchaseVendor.COINFLOW)
            }
          ]
        : []),
      {
        text: PurchaseVendor.STRIPE,
        callback: () => handleSelect(PurchaseVendor.STRIPE)
      }
    ],
    [handleSelect, isCoinflowEnabled]
  )

  return <ActionDrawer modalName={MODAL_NAME} rows={rows} />
}
