import { useEffect } from 'react'

import type { Nullable, BNUSDC } from '@audius/common'
import {
  PurchaseMethod,
  formatUSDCWeiToFloorCentsNumber,
  formatCurrencyBalance,
  PurchaseVendor,
  removeNullable
} from '@audius/common'
import BN from 'bn.js'
import { FlatList, View, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCreditCard from 'app/assets/images/iconCreditCard.svg'
import IconDonate from 'app/assets/images/iconDonate.svg'
import IconTransaction from 'app/assets/images/iconTransaction.svg'
import { Divider, RadioButton, Text } from 'app/components/core'
import { getPurchaseVendor } from 'app/store/purchase-vendor/selectors'
import { setPurchaseVendor } from 'app/store/purchase-vendor/slice'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

import { SummaryTable } from '../summary-table'
import type { SummaryTableItem } from '../summary-table/SummaryTable'

import { CardSelectionButton } from './CardSelectionButton'

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
  selectedMethod: Nullable<PurchaseMethod>
  setSelectedMethod: (method: PurchaseMethod) => void
  balance?: Nullable<BNUSDC>
  isExistingBalanceDisabled?: boolean
  showExistingBalance?: boolean
  isCoinflowEnabled?: boolean
}

export const PaymentMethod = ({
  selectedMethod,
  setSelectedMethod,
  balance,
  isExistingBalanceDisabled,
  showExistingBalance,
  isCoinflowEnabled
}: PaymentMethodProps) => {
  const styles = useStyles()
  const neutral = useColor('neutral')
  const dispatch = useDispatch()

  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)
  const purchaseVendor = useSelector(getPurchaseVendor)
  const vendorOptions = [
    isCoinflowEnabled ? PurchaseVendor.COINFLOW : null,
    PurchaseVendor.STRIPE
  ].filter(removeNullable)

  // Set initial state if coinflow is enabled
  useEffect(() => {
    if (isCoinflowEnabled) {
      dispatch(setPurchaseVendor(PurchaseVendor.COINFLOW))
    }
  }, [dispatch, isCoinflowEnabled])

  const items: SummaryTableItem[] = [
    {
      id: PurchaseMethod.CARD,
      value: PurchaseMethod.CARD,
      label: (
        <Text fontSize='medium' weight='medium'>
          {messages.withCard}
        </Text>
      ),
      icon: IconCreditCard,
      content:
        vendorOptions.length > 1 ? (
          <CardSelectionButton selectedVendor={purchaseVendor} />
        ) : null
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
              selectedMethod === PurchaseMethod.BALANCE
                ? 'secondary'
                : 'neutral'
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
    const isSelected = value === selectedMethod
    return (
      <TouchableOpacity
        style={styles.row}
        disabled={disabled}
        onPress={() => setSelectedMethod(value)}
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
