import { ChangeEvent, useCallback, useState } from 'react'

import {
  BNUSDC,
  Vendors,
  decimalIntegerToHumanReadable,
  formatUSDCWeiToFloorCentsNumber,
  useCreateUserbankIfNeeded,
  useUSDCBalance
} from '@audius/common'
import {
  Box,
  Button,
  ButtonType,
  Flex,
  Text,
  IconLogoCircleUSDC,
  IconCreditCard,
  IconTransaction,
  FilterButton,
  FilterButtonType
} from '@audius/harmony'
import { BN } from 'bn.js'
import cn from 'classnames'

import { MobileFilterButton } from 'components/mobile-filter-button/MobileFilterButton'
import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { track } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { isMobile } from 'utils/clientUtil'
import { zIndex } from 'utils/zIndex'

import styles from './AddFunds.module.css'

const messages = {
  usdcBalance: 'USDC Balance',
  paymentMethod: 'Payment Method',
  withCard: 'Add funds with Card',
  withCrypto: 'Add funds with crypto transfer',
  continue: 'Continue'
}

export type Method = 'card' | 'crypto'

export const AddFunds = ({
  onContinue
}: {
  onContinue: (method: Method) => void
}) => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    audiusBackendInstance,
    mint: 'usdc'
  })
  const [selectedMethod, setSelectedMethod] = useState<Method>('card')
  const mobile = isMobile()
  const { data: balance } = useUSDCBalance({ isPolling: true })
  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

  const items: SummaryTableItem[] = [
    {
      id: 'card',
      label: messages.withCard,
      icon: IconCreditCard,
      value: mobile ? (
        <MobileFilterButton
          onSelect={() => {}}
          options={[{ label: Vendors.STRIPE }]}
          zIndex={zIndex.ADD_FUNDS_VENDOR_SELECTION_DRAWER}
        />
      ) : (
        <FilterButton
          onSelect={() => {}}
          initialSelectionIndex={0}
          variant={FilterButtonType.REPLACE_LABEL}
          options={[{ label: Vendors.STRIPE }]}
        />
      )
    },
    {
      id: 'crypto',
      label: messages.withCrypto,
      icon: IconTransaction
    }
  ]

  const handleChangeOption = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSelectedMethod(e.target.value as Method)
    },
    [setSelectedMethod]
  )

  return (
    <div className={styles.root}>
      <div
        className={cn(styles.buttonContainer, {
          [styles.mobile]: mobile
        })}
      >
        <Flex direction='column' w='100%' gap='xl'>
          <Box h='unit6' border='strong' p='m' borderRadius='s'>
            <Flex alignItems='center' justifyContent='space-between'>
              <Flex alignItems='center'>
                <IconLogoCircleUSDC />
                <Box pl='s'>
                  <Text variant='title' size='m'>
                    {messages.usdcBalance}
                  </Text>
                </Box>
              </Flex>
              <Text variant='title' size='l' strength='strong'>
                {`$${balanceFormatted}`}
              </Text>
            </Flex>
          </Box>
          <SummaryTable
            title={messages.paymentMethod}
            items={items}
            withRadioOptions
            onRadioChange={handleChangeOption}
            selectedRadioOption={selectedMethod}
            rowClassName={mobile ? styles.summaryTableRow : undefined}
            rowValueClassName={mobile ? styles.summaryTableRowValue : undefined}
          />
          <Button
            variant={ButtonType.PRIMARY}
            fullWidth
            onClick={() => onContinue(selectedMethod)}
          >
            {messages.continue}
          </Button>
        </Flex>
      </div>
    </div>
  )
}
