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
import { Access } from '@audius/sdk'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconLock, IconLockUnlocked } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { setVisibility } from 'app/store/drawers/slice'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const { getGatedContentStatusMap } = gatedContentSelectors
const { setLockedContentId } = gatedContentActions

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked',
  price: (price: string) => `$${price}`
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    ...flexRowCentered(),
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(3),
    backgroundColor: palette.accentBlue,
    borderRadius: spacing(1),
    gap: spacing(1)
  },
  text: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.small,
    color: palette.staticWhite
  },
  loadingSpinner: {
    width: spacing(4),
    height: spacing(4)
  },
  usdcPurchase: {
    backgroundColor: palette.specialLightGreen
  },
  unlocked: {
    borderRadius: spacing(3),
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(2.5)
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
  const dispatch = useDispatch()
  const isUSDCEnabled = useIsUSDCEnabled()
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const gatedTrackStatus = gatedTrackStatusMap[contentId]
  const staticWhite = useColor('staticWhite')
  const isUSDCPurchase =
    isUSDCEnabled && isContentUSDCPurchaseGated(streamConditions)
  const isUnlocking = gatedTrackStatus === 'UNLOCKING'

  const handlePress = useCallback(() => {
    if (isUSDCPurchase && !hasStreamAccess) {
      openPremiumContentPurchaseModal(
        { contentId, contentType },
        { source: ModalSource.TrackTile }
      )
      return
    }
    if (contentId) {
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

  const showButtonText =
    (isUSDCPurchase && !hasStreamAccess && !isUnlocking) || !isUSDCPurchase

  return (
    <TouchableOpacity onPress={handlePress}>
      <View
        style={[
          styles.root,
          isUSDCPurchase ? styles.usdcPurchase : null,
          hasStreamAccess ? styles.unlocked : null
        ]}
      >
        {hasStreamAccess ? (
          <IconLockUnlocked
            fill={staticWhite}
            width={spacing(4)}
            height={spacing(4)}
          />
        ) : isUnlocking ? (
          <LoadingSpinner style={styles.loadingSpinner} fill={staticWhite} />
        ) : (
          <IconLock fill={staticWhite} width={spacing(4)} height={spacing(4)} />
        )}
        {showButtonText ? <Text style={styles.text}>{buttonText}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}
