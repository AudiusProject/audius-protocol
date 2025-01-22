import { useCallback } from 'react'

import type { ID, AccessConditions } from '@audius/common/models'
import { ModalSource, isContentUSDCPurchaseGated } from '@audius/common/models'
import {
  PurchaseableContentType,
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
import { make, track } from 'app/services/analytics'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'

import { LineupTileSource } from './types'

const { getGatedContentStatusMap } = gatedContentSelectors
const { setLockedContentId } = gatedContentActions

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked',
  price: (price: string) => `$${price}`
}

const useStyles = makeStyles(({ spacing }) => ({
  loadingSpinner: {
    width: spacing(4),
    height: spacing(4)
  }
}))

export const LineupTileAccessStatus = ({
  contentId,
  contentType,
  streamConditions,
  hasStreamAccess,
  source: tileSource
}: {
  contentId: ID
  contentType: PurchaseableContentType
  streamConditions: AccessConditions
  hasStreamAccess: boolean | undefined
  source?: LineupTileSource
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
      track(
        make({
          eventName: EventNames.PURCHASE_CONTENT_BUY_CLICKED,
          contentId,
          contentType
        })
      )
      const determineModalSource = () => {
        if (tileSource === LineupTileSource.DM_COLLECTION) {
          return ModalSource.DirectMessageCollectionTile
        }
        if (tileSource === LineupTileSource.DM_TRACK) {
          return ModalSource.DirectMessageTrackTile
        }
        return contentType === PurchaseableContentType.ALBUM
          ? ModalSource.LineUpCollectionTile
          : ModalSource.LineUpTrackTile
      }
      openPremiumContentPurchaseModal(
        { contentId, contentType },
        {
          source: determineModalSource()
        }
      )
    } else if (contentId) {
      dispatch(setLockedContentId({ id: contentId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    }
  }, [
    hasStreamAccess,
    isUSDCPurchase,
    contentId,
    openPremiumContentPurchaseModal,
    contentType,
    tileSource,
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
          <IconLockUnlocked color='white' size='xs' />
        ) : isUnlocking ? (
          <LoadingSpinner
            style={styles.loadingSpinner}
            fill={color.icon.staticWhite}
          />
        ) : (
          <IconLock color='white' size='s' />
        )}
        {showButtonText ? (
          <Text color='white' variant='label' size='m'>
            {buttonText}
          </Text>
        ) : null}
      </Flex>
    </TouchableOpacity>
  )
}
