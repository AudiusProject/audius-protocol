import { CSSProperties, ChangeEvent, useCallback } from 'react'

import { PurchaseMethod, PurchaseVendor, BNUSDC } from '@audius/common/models'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  Nullable
} from '@audius/common/utils'
import {
  FilterButton,
  Flex,
  IconCreditCard,
  IconDonate,
  IconTransaction,
  Radio,
  RadioGroup,
  Text
} from '@audius/harmony'
import BN from 'bn.js'

import { MobileFilterButton } from 'components/mobile-filter-button/MobileFilterButton'
import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { useIsMobile } from 'hooks/useIsMobile'
import zIndex from 'utils/zIndex'

const messages = {
  paymentMethod: 'Payment Method',
  withExistingBalance: 'Existing balance',
  withCard: 'Pay with card',
  withCrypto: 'Add via crypto transfer'
}

type PaymentMethodProps = {
  selectedMethod: Nullable<PurchaseMethod>
  setSelectedMethod: (method: PurchaseMethod) => void
  selectedVendor: Nullable<PurchaseVendor>
  setSelectedVendor: (vendor: PurchaseVendor) => void
  balance?: Nullable<BNUSDC>
  isExistingBalanceDisabled?: boolean
  isCoinflowEnabled?: boolean
  showExistingBalance?: boolean
  showVendorChoice?: boolean
}

export const PaymentMethod = ({
  selectedMethod,
  setSelectedMethod,
  selectedVendor,
  setSelectedVendor,
  balance,
  isExistingBalanceDisabled,
  showExistingBalance,
  isCoinflowEnabled,
  showVendorChoice
}: PaymentMethodProps) => {
  const isMobile = useIsMobile()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)
  const vendorOptions = [
    ...(isCoinflowEnabled ? [{ value: PurchaseVendor.COINFLOW }] : []),
    { value: PurchaseVendor.STRIPE }
  ]

  const handleSelectVendor = useCallback(
    (label: string) => {
      setSelectedVendor(label as PurchaseVendor)
    },
    [setSelectedVendor]
  )

  const options = [
    showExistingBalance
      ? {
          id: PurchaseMethod.BALANCE,
          label: messages.withExistingBalance,
          icon: IconDonate,
          disabled: isExistingBalanceDisabled,
          value: (
            <Text
              tag='span' // Needed to avoid <p> inside <p> warning
              variant='title'
              color={
                selectedMethod === PurchaseMethod.BALANCE ? 'accent' : undefined
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
        vendorOptions.length > 1 && showVendorChoice ? (
          isMobile ? (
            <MobileFilterButton
              onSelect={handleSelectVendor}
              selection={selectedVendor?.toString()}
              options={vendorOptions}
              zIndex={zIndex.ADD_FUNDS_VENDOR_SELECTION_DRAWER}
            />
          ) : (
            <FilterButton
              onChange={handleSelectVendor}
              value={selectedVendor?.toString()}
              variant='replaceLabel'
              options={vendorOptions}
              popupProps={{ zIndex: zIndex.USDC_ADD_FUNDS_FILTER_BUTTON_POPUP }}
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
      setSelectedMethod(e.target.value as PurchaseMethod)
    },
    [setSelectedMethod]
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
      <RadioGroup
        name={`summaryTable-label-${messages.paymentMethod}`}
        value={selectedMethod}
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
              onClick={() => setSelectedMethod(id as PurchaseMethod)}
              css={{ cursor: 'pointer' }}
              alignItems='center'
              justifyContent='space-between'
              gap='s'
            >
              <Radio value={id} disabled={disabled} />
              {Icon ? (
                <Flex alignItems='center' ml='s'>
                  <Icon color='default' />
                </Flex>
              ) : null}
              <Text variant='body' strength='default' size='m'>
                {label}
              </Text>
            </Flex>
            <Text
              variant='body'
              css={{
                width: isMobile && id === PurchaseMethod.CARD ? '100%' : 'auto'
              }}
            >
              {value}
            </Text>
          </Flex>
        ))}
      </RadioGroup>
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
