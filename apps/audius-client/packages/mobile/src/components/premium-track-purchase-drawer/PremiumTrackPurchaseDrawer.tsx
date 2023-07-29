import {
  cacheTracksSelectors,
  formatUSDCWeiToUSDString,
  isPremiumContentUSDCPurchaseGated
} from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import { LockedStatusBadge, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles, flexRowCentered } from 'app/styles'
import { useColor } from 'app/utils/theme'

import { TrackDetailsTile } from '../track-details-tile'

import { StripePurchaseConfirmationButton } from './StripePurchaseConfirmationButton'

const { getTrack } = cacheTracksSelectors

const PREMIUM_TRACK_PURCHASE_MODAL_NAME = 'PremiumTrackPurchase'

const messages = {
  title: 'Complete Purchase',
  summary: 'Summary',
  artistCut: 'Artist Cut',
  audiusCut: 'Audius Cut',
  alwaysZero: 'Always $0',
  youPay: 'You Pay',
  price: (price: string) => `$${price}`,
  payToUnlock: 'Pay-To-Unlock',
  disclaimer:
    'By clicking on "Buy", you agree to our Terms of Use. Your purchase will be made in USDC via 3rd party payment provider. Additional payment provider fees may apply. Any remaining USDC balance in your Audius wallet will be applied to this transaction. Once your payment is confirmed, your premium content will be unlocked and available to stream.'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(4),
    gap: spacing(6),
    backgroundColor: palette.white
  },
  titleContainer: {
    ...flexRowCentered(),
    gap: spacing(2),
    marginBottom: spacing(2),
    alignSelf: 'center'
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight2,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.xl * 1.25
  },
  trackTileContainer: {
    ...flexRowCentered(),
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: spacing(2),
    backgroundColor: palette.neutralLight10
  },
  summaryContainer: {
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: spacing(1)
  },
  summaryRow: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  lastRow: {
    borderBottomWidth: 0
  },
  greyRow: {
    backgroundColor: palette.neutralLight10
  },
  summaryTitle: {
    letterSpacing: 1
  },
  payToUnlockTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    marginBottom: spacing(2)
  }
}))

export const PremiumTrackPurchaseDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')
  const { data } = useDrawer('PremiumTrackPurchase')
  const { trackId } = data
  const track = useSelector((state) => getTrack(state, { id: trackId }))

  const { premium_conditions: premiumConditions } = track ?? {}

  if (!track || !isPremiumContentUSDCPurchaseGated(premiumConditions))
    return null

  const price = formatUSDCWeiToUSDString(premiumConditions.usdc_purchase.price)

  return (
    <NativeDrawer drawerName={PREMIUM_TRACK_PURCHASE_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconCart fill={neutralLight2} />
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <TrackDetailsTile trackId={track.track_id} />
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryRow, styles.greyRow]}>
            <Text
              weight='bold'
              textTransform='uppercase'
              style={styles.summaryTitle}
            >
              {messages.summary}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>{messages.artistCut}</Text>
            <Text>{messages.price(price)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>{messages.audiusCut}</Text>
            <Text>{messages.alwaysZero}</Text>
          </View>
          <View style={[styles.summaryRow, styles.lastRow, styles.greyRow]}>
            <Text weight='bold'>{messages.youPay}</Text>
            <Text weight='bold' color='secondary'>
              {messages.price(price)}
            </Text>
          </View>
        </View>
        <View>
          <View style={styles.payToUnlockTitleContainer}>
            <Text weight='heavy' textTransform='uppercase' fontSize='small'>
              {messages.payToUnlock}
            </Text>
            <LockedStatusBadge locked />
          </View>
          <Text>{messages.disclaimer}</Text>
        </View>
        <StripePurchaseConfirmationButton price={price} />
      </View>
    </NativeDrawer>
  )
}
