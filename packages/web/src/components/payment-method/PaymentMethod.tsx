import { CSSProperties, ChangeEvent, useCallback } from 'react'

import {
  BNUSDC,
  Nullable,
  PurchaseMethod,
  PurchaseVendor,
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber
} from '@audius/common'
import {
  FilterButton,
  FilterButtonType,
  Flex,
  IconCreditCard,
  IconDonate,
  IconTransaction
} from '@audius/harmony'
import { RadioButton, RadioButtonGroup } from '@audius/stems'
import BN from 'bn.js'

import { MobileFilterButton } from 'components/mobile-filter-button/MobileFilterButton'
import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { Text } from 'components/typography'
import { useIsMobile } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

const messages = {
  paymentMethod: 'Payment Method',
  withExistingBalance: 'Existing balance',
  withCard: 'Pay with card',
  withCrypto: 'Add via crypto transfer'
}

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
  const isMobile = useIsMobile()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)
  const vendorOptions = [{ label: PurchaseVendor.STRIPE }]

  const options = [
    showExistingBalance
      ? {
          id: PurchaseMethod.BALANCE,
          label: messages.withExistingBalance,
          icon: IconDonate,
          disabled: isExistingBalanceDisabled,
          value: (
            <Text
              as='span' // Needed to avoid <p> inside <p> warning
              variant='title'
              color={
                selectedType === PurchaseMethod.BALANCE
                  ? 'secondary'
                  : undefined
              }
            >
              ${balanceFormatted}
            </Text>
          )
        }
      : null,
    {
      id: PurchaseMethod.CARD,
      label: messages.withCard,
      icon: IconCreditCard,
      value:
        vendorOptions.length > 1 ? (
          isMobile ? (
            <MobileFilterButton
              onSelect={() => {}}
              options={vendorOptions}
              zIndex={zIndex.ADD_FUNDS_VENDOR_SELECTION_DRAWER}
            />
          ) : (
            <FilterButton
              onSelect={() => {}}
              initialSelectionIndex={0}
              variant={FilterButtonType.REPLACE_LABEL}
              options={vendorOptions}
              popupZIndex={zIndex.USDC_ADD_FUNDS_FILTER_BUTTON_POPUP}
            />
          )
        ) : null
    },
    {
      id: PurchaseMethod.CRYPTO,
      label: messages.withCrypto,
      icon: IconTransaction
    }
  ].filter(Boolean) as SummaryTableItem[]

  const handleRadioChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSelectedType(e.target.value as PurchaseMethod)
    },
    [setSelectedType]
  )

  const renderBody = () => {
    const getFlexProps = (id: PurchaseMethod) => {
      if (isMobile && id === PurchaseMethod.CARD) {
        return {
          direction: 'column' as CSSProperties['flexDirection'],
          justifyContent: 'center',
          justifySelf: 'stretch',
          alignItems: 'flex-start'
        }
      }
      return {
        direction: 'row' as CSSProperties['flexDirection'],
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'space-between'
      }
    }
    return (
      <RadioButtonGroup
        name={`summaryTable-label-${messages.paymentMethod}`}
        value={selectedType}
        onChange={handleRadioChange}
        style={{ width: '100%' }}
      >
        {options.map(({ id, label, icon: Icon, value, disabled }) => (
          <Flex
            key={id}
            {...getFlexProps(id as PurchaseMethod)}
            pv='m'
            ph='xl'
            css={{ opacity: disabled ? 0.5 : 1 }}
            borderTop='default'
          >
            <Flex
              onClick={() => setSelectedType(id as PurchaseMethod)}
              css={{ cursor: 'pointer' }}
              alignItems='center'
              justifyContent='space-between'
              gap='s'
            >
              <RadioButton value={id} disabled={disabled} />
              {Icon ? (
                <Flex alignItems='center' ml='s'>
                  <Icon color='default' />
                </Flex>
              ) : null}
              <Text>{label}</Text>
            </Flex>
            <Text
              css={{
                width: isMobile && id === PurchaseMethod.CARD ? '100%' : 'auto'
              }}
            >
              {value}
            </Text>
          </Flex>
        ))}
      </RadioButtonGroup>
    )
  }

  return (
    <SummaryTable
      title={messages.paymentMethod}
      items={options}
      renderBody={renderBody}
    />
  )
}
