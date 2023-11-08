import { useCallback } from 'react'

import type { ID, PremiumConditions } from '@audius/common'
import {
  ModalSource,
  formatPrice,
  isPremiumContentUSDCPurchaseGated,
  premiumContentActions,
  premiumContentSelectors,
  usePremiumContentPurchaseModal
} from '@audius/common'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconLock from 'app/assets/images/iconLock.svg'
import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { setVisibility } from 'app/store/drawers/slice'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const { getPremiumTrackStatusMap } = premiumContentSelectors
const { setLockedContentId } = premiumContentActions

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
  }
}))

export const LineupTileAccessStatus = ({
  trackId,
  premiumConditions
}: {
  trackId: ID
  premiumConditions: PremiumConditions
}) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const isUSDCEnabled = useIsUSDCEnabled()
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = premiumTrackStatusMap[trackId]
  const staticWhite = useColor('staticWhite')
  const isUSDCPurchase =
    isUSDCEnabled && isPremiumContentUSDCPurchaseGated(premiumConditions)

  const handlePress = useCallback(() => {
    if (isUSDCPurchase) {
      openPremiumContentPurchaseModal(
        { contentId: trackId },
        { source: ModalSource.TrackTile }
      )
    } else if (trackId) {
      dispatch(setLockedContentId({ id: trackId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    }
  }, [trackId, isUSDCPurchase, openPremiumContentPurchaseModal, dispatch])

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.root, isUSDCPurchase ? styles.usdcPurchase : null]}>
        {premiumTrackStatus === 'UNLOCKING' ? (
          <LoadingSpinner style={styles.loadingSpinner} fill={staticWhite} />
        ) : (
          <IconLock fill={staticWhite} width={spacing(4)} height={spacing(4)} />
        )}
        <Text style={styles.text}>
          {isUSDCPurchase
            ? premiumTrackStatus === 'UNLOCKING'
              ? null
              : messages.price(
                  formatPrice(premiumConditions.usdc_purchase.price)
                )
            : premiumTrackStatus === 'UNLOCKING'
            ? messages.unlocking
            : messages.locked}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
