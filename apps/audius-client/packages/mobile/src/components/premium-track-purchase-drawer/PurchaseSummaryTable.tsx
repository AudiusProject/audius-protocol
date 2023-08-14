import { formatPrice } from '@audius/common'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'

const messages = {
  summary: 'Summary',
  artistCut: 'Artist Cut',
  audiusCut: 'Audius Cut',
  alwaysZero: 'Always $0',
  existingBalance: 'Existing Balance',
  youPay: 'You Pay',
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
  finalPriceContainer: {
    flexDirection: 'row',
    gap: spacing(2)
  },
  strikeThrough: {
    textDecorationLine: 'line-through'
  }
}))

type PurchaseSummaryTableProps = {
  amountDue: number
  artistCut: number
  basePrice: number
  existingBalance?: number
  isPurchaseSuccessful: boolean
}

export const PurchaseSummaryTable = ({
  amountDue,
  artistCut,
  basePrice,
  existingBalance,
  isPurchaseSuccessful
}: PurchaseSummaryTableProps) => {
  const styles = useStyles()
  const amountDueFormatted = formatPrice(amountDue)

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
          <Text>{messages.artistCut}</Text>
          <Text>{messages.price(formatPrice(artistCut))}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{messages.audiusCut}</Text>
          <Text>{messages.alwaysZero}</Text>
        </View>
        {existingBalance ? (
          <View style={styles.summaryRow}>
            <Text>{messages.existingBalance}</Text>
            <Text>{messages.subtractPrice(formatPrice(existingBalance))}</Text>
          </View>
        ) : null}
        <View style={[styles.summaryRow, styles.lastRow, styles.greyRow]}>
          <Text weight='bold'>
            {isPurchaseSuccessful ? messages.youPaid : messages.youPay}
          </Text>
          <View style={styles.finalPriceContainer}>
            {existingBalance ? (
              <>
                <Text
                  weight='bold'
                  color='secondary'
                  style={styles.strikeThrough}
                >
                  {messages.price(formatPrice(basePrice))}
                </Text>
                <Text weight='bold' color='secondary'>
                  {messages.price(amountDueFormatted)}
                </Text>
              </>
            ) : (
              <Text weight='bold' color='secondary'>
                {messages.price(amountDueFormatted)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </>
  )
}
