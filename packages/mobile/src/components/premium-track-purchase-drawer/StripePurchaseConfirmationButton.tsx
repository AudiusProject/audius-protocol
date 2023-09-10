import { useCallback } from 'react'

import type { ID } from '@audius/common'
import {
  purchaseContentActions,
  ContentType,
  purchaseContentSelectors,
  isContentPurchaseInProgress
} from '@audius/common'
import { useSelector, useDispatch } from 'react-redux'

import { Button } from 'app/components/core'
import { useThemeColors } from 'app/utils/theme'

import LoadingSpinner from '../loading-spinner/LoadingSpinner'

const { getPurchaseContentFlowStage } = purchaseContentSelectors
const { startPurchaseContentFlow } = purchaseContentActions

const messages = {
  buy: (price: string) => `Buy $${price}`,
  purchasing: 'Purchasing'
}

type StripePurchaseConfirmationButtonProps = {
  trackId: ID
  price: string
}

export const StripePurchaseConfirmationButton = ({
  trackId,
  price
}: StripePurchaseConfirmationButtonProps) => {
  const dispatch = useDispatch()
  const { specialLightGreen } = useThemeColors()
  const stage = useSelector(getPurchaseContentFlowStage)
  const isLoading = isContentPurchaseInProgress(stage)

  const handleBuyPress = useCallback(() => {
    dispatch(
      startPurchaseContentFlow({
        contentId: trackId,
        contentType: ContentType.TRACK
      })
    )
  }, [dispatch, trackId])

  return (
    <Button
      onPress={handleBuyPress}
      disabled={isLoading}
      title={isLoading ? messages.purchasing : messages.buy(price)}
      variant={'primary'}
      size='large'
      color={specialLightGreen}
      iconPosition='left'
      icon={isLoading ? LoadingSpinner : undefined}
      fullWidth
    />
  )
}
