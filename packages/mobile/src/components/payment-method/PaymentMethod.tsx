import type { Nullable, BNUSDC } from '@audius/common'
import {
  PurchaseMethod,
  formatUSDCWeiToFloorCentsNumber,
  formatCurrencyBalance
} from '@audius/common'
import BN from 'bn.js'
import { FlatList, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import IconCreditCard from 'app/assets/images/iconCreditCard.svg'
import IconDonate from 'app/assets/images/iconDonate.svg'
import IconTransaction from 'app/assets/images/iconTransaction.svg'
import { Divider, RadioButton, Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

import { SummaryTable } from '../summary-table'
import type { SummaryTableItem } from '../summary-table/SummaryTable'

const messages = {
  title: 'Payment Method',
  existingBalance: 'Existing balance',
  withCard: 'Pay with card',
  withCrypto: 'Add via crypto transfer'
}

const useStyles = makeStyles(({ spacing }) => ({
  row: {
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6)
  },
  rowTitle: {
    ...flexRowCentered(),
    gap: spacing(3)
  },
  rowTitleText: {
    ...flexRowCentered(),
    gap: spacing(2)
  },
  rowContent: {
    marginTop: spacing(3)
  },
  balance: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    flexGrow: 1
  },
  disabled: {
    opacity: 0.5
  }
}))

type PaymentMethodProps = {
  selectedType: Nullable<PurchaseMethod>
  setSelectedType: (method: PurchaseMethod) => void
  balance?: Nullable<BNUSDC>
  isExistingBalanceDisabled?: boolean
  showExistingBalance?: boolean
}

export const PaymentMethod = ({
  selectedType,
  setSelectedType,
  balance,
  isExistingBalanceDisabled,
  showExistingBalance
}: PaymentMethodProps) => {
  const styles = useStyles()
  const neutral = useColor('neutral')

  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)

  const items: SummaryTableItem[] = [
    {
      id: PurchaseMethod.CARD,
      value: PurchaseMethod.CARD,
      label: (
        <Text fontSize='medium' weight='medium'>
          {messages.withCard}
        </Text>
      ),
      icon: IconCreditCard
    },
    {
      id: PurchaseMethod.CRYPTO,
      value: PurchaseMethod.CRYPTO,
      label: (
        <Text fontSize='medium' weight='medium'>
          {messages.withCrypto}
        </Text>
      ),
      icon: IconTransaction
    }
  ]
  if (showExistingBalance) {
    items.unshift({
      id: PurchaseMethod.BALANCE,
      value: PurchaseMethod.BALANCE,
      label: (
        <View
          style={[
            styles.balance,
            isExistingBalanceDisabled ? styles.disabled : null
          ]}
        >
          <Text>{messages.existingBalance}</Text>
          <Text
            fontSize='medium'
            weight='bold'
            color={
              selectedType === PurchaseMethod.BALANCE ? 'secondary' : 'neutral'
            }
          >
            ${balanceFormatted}
          </Text>
        </View>
      ),
      icon: () => (
        <IconDonate
          style={isExistingBalanceDisabled ? styles.disabled : null}
          width={spacing(6)}
          height={spacing(6)}
          fill={neutral}
        />
      ),
      disabled: isExistingBalanceDisabled
    })
  }

  const renderItem = ({ item }) => {
    const { label, value, icon: Icon, content, disabled } = item
    const isSelected = value === selectedType
    return (
      <TouchableOpacity
        style={styles.row}
        disabled={disabled}
        onPress={() => setSelectedType(value)}
      >
        <View style={styles.rowTitle}>
          <RadioButton checked={isSelected} disabled={disabled} />
          <View style={styles.rowTitleText}>
            <Icon />
          </View>
          {label}
        </View>
        {isSelected && content ? (
          <View style={styles.rowContent}>{content}</View>
        ) : null}
      </TouchableOpacity>
    )
  }

  return (
    <SummaryTable
      title={messages.title}
      items={items}
      renderBody={(items: SummaryTableItem[]) => (
        <FlatList
          renderItem={renderItem}
          ItemSeparatorComponent={Divider}
          data={items}
        />
      )}
    />
  )
}
