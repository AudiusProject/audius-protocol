import { formatPrice, isNullOrUndefined } from '@audius/common'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'

const messages = {
  summary: 'Summary',
  payExtra: 'Pay Extra',
  premiumTrack: 'Premium Track',
  existingBalance: 'Existing Balance',
  total: 'Total',
  youPaid: 'You Paid',
  price: (price: string) => `$${price}`,
  subtractPrice: (price: string) => `-$${price}`
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
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
  strikeThrough: {
    textDecorationLine: 'line-through'
  }
}))

type PurchaseSummaryTableProps = {
  amountDue: number
  extraAmount?: number
  basePrice: number
  existingBalance?: number
  isPurchaseSuccessful: boolean
}

export const PurchaseSummaryTable = ({
  amountDue,
  extraAmount,
  basePrice,
  existingBalance,
  isPurchaseSuccessful
}: PurchaseSummaryTableProps) => {
  const styles = useStyles()

  return (
    <>
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
          <Text>{messages.premiumTrack}</Text>
          <Text>{messages.price(formatPrice(basePrice))}</Text>
        </View>
        {extraAmount ? (
          <View style={styles.summaryRow}>
            <Text>{messages.payExtra}</Text>
            <Text>{messages.price(formatPrice(extraAmount))}</Text>
          </View>
        ) : null}
        {!isNullOrUndefined(existingBalance) && existingBalance > 0 ? (
          <View style={styles.summaryRow}>
            <Text>{messages.existingBalance}</Text>
            <Text>{messages.subtractPrice(formatPrice(existingBalance))}</Text>
          </View>
        ) : null}
        <View style={[styles.summaryRow, styles.lastRow, styles.greyRow]}>
          <Text weight='bold'>
            {isPurchaseSuccessful ? messages.youPaid : messages.total}
          </Text>
          <Text weight='bold' color='secondary'>
            {messages.price(formatPrice(amountDue))}
          </Text>
        </View>
      </View>
    </>
  )
}
