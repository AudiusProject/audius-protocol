import type { ID, PremiumConditions } from '@audius/common'
import {
  isPremiumContentUSDCPurchaseGated,
  premiumContentSelectors
} from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconLock from 'app/assets/images/iconLock.svg'
import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const { getPremiumTrackStatusMap } = premiumContentSelectors

const messages = {
  unlocking: 'Unlocking',
  locked: 'Locked'
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
    backgroundColor: palette.specialLightGreen1
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
  const isUSDCEnabled = useIsUSDCEnabled()
  const premiumTrackStatusMap = useSelector(getPremiumTrackStatusMap)
  const premiumTrackStatus = premiumTrackStatusMap[trackId]
  const staticWhite = useColor('staticWhite')

  return (
    <View
      style={[
        styles.root,
        isUSDCEnabled && isPremiumContentUSDCPurchaseGated(premiumConditions)
          ? styles.usdcPurchase
          : null
      ]}
    >
      {premiumTrackStatus === 'UNLOCKING' ? (
        <LoadingSpinner style={styles.loadingSpinner} fill={staticWhite} />
      ) : (
        <IconLock fill={staticWhite} width={16} height={16} />
      )}
      <Text style={styles.text}>
        {premiumTrackStatus === 'UNLOCKING'
          ? messages.unlocking
          : messages.locked}
      </Text>
    </View>
  )
}
