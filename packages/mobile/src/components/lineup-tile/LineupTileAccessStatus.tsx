import { useCallback } from 'react'

import type { ID, AccessConditions } from '@audius/common/models'
import { ModalSource, isContentUSDCPurchaseGated } from '@audius/common/models'
import type { PurchaseableContentType } from '@audius/common/store'
import {
  usePremiumContentPurchaseModal,
  gatedContentActions,
  gatedContentSelectors
} from '@audius/common/store'
import { formatPrice } from '@audius/common/utils'
import { TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import type { FlexProps } from '@audius/harmony-native'
import {
  Flex,
  IconLock,
  IconLockUnlocked,
  useTheme,
  Text
} from '@audius/harmony-native'
import LoadingSpinner from 'app/components/loading-spinner'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

const { getGatedContentStatusMap } = gatedContentSelectors
const { setLockedContentId } = gatedContentActions

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked',
  price: (price: string) => `$${price}`
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  loadingSpinner: {
    width: spacing(4),
    height: spacing(4)
  }
}))

export const LineupTileAccessStatus = ({
  contentId,
  contentType,
  streamConditions,
  hasStreamAccess
}: {
  contentId: ID
  contentType: PurchaseableContentType
  streamConditions: AccessConditions
  hasStreamAccess: boolean | undefined
}) => {
  const styles = useStyles()
  const { color } = useTheme()
  const dispatch = useDispatch()
  const isUSDCEnabled = useIsUSDCEnabled()
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const gatedTrackStatus = gatedTrackStatusMap[contentId]
  const isUSDCPurchase =
    isUSDCEnabled && isContentUSDCPurchaseGated(streamConditions)
  const isUnlocking = gatedTrackStatus === 'UNLOCKING'

  const handlePress = useCallback(() => {
    if (hasStreamAccess) {
      return
    }
    if (isUSDCPurchase) {
      openPremiumContentPurchaseModal(
        { contentId, contentType },
        { source: ModalSource.TrackTile }
      )
    } else if (contentId) {
      dispatch(setLockedContentId({ id: contentId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    }
  }, [
    isUSDCPurchase,
    hasStreamAccess,
    contentId,
    openPremiumContentPurchaseModal,
    contentType,
    dispatch
  ])

  const buttonText = isUSDCPurchase
    ? messages.price(formatPrice(streamConditions.usdc_purchase.price))
    : isUnlocking
    ? messages.unlocking
    : messages.locked

  const showButtonText = !isUSDCPurchase || (!hasStreamAccess && !isUnlocking)

  const backgroundColor = isUSDCPurchase
    ? color.special.lightGreen
    : color.special.blue

  const lockedStyles: FlexProps = {
    borderRadius: 's',
    ph: 'm',
    pv: 'xs',
    style: { backgroundColor }
  }

  const unlockedStyles: FlexProps = {
    borderRadius: 'l',
    ph: 's',
    pv: '2xs',
    style: { backgroundColor }
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <Flex
        {...(hasStreamAccess || isUnlocking ? unlockedStyles : lockedStyles)}
        direction='row'
        alignItems='center'
        gap='xs'
      >
        {hasStreamAccess ? (
          <IconLockUnlocked color='staticWhite' size='xs' />
        ) : isUnlocking ? (
          <LoadingSpinner
            style={styles.loadingSpinner}
            fill={color.icon.staticWhite}
          />
        ) : (
          <IconLock color='staticWhite' size='s' />
        )}
        {showButtonText ? (
          <Text color='staticWhite' variant='label' size='m'>
            {buttonText}
          </Text>
        ) : null}
      </Flex>
    </TouchableOpacity>
  )
}
