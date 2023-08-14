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
  price: string
  isPurchaseSuccessful: boolean
  existingBalance?: string
}

export const PurchaseSummaryTable = ({
  price,
  isPurchaseSuccessful,
  existingBalance
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
          <Text>{messages.artistCut}</Text>
          <Text>{messages.price(price)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{messages.audiusCut}</Text>
          <Text>{messages.alwaysZero}</Text>
        </View>
        {existingBalance ? (
          <View style={styles.summaryRow}>
            <Text>{messages.existingBalance}</Text>
            <Text>{messages.subtractPrice(existingBalance)}</Text>
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
                  {messages.price(price)}
                </Text>
                <Text weight='bold' color='secondary'>
                  {messages.price('0.50')}
                </Text>
              </>
            ) : (
              <Text weight='bold' color='secondary'>
                {messages.price(price)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </>
  )
}
