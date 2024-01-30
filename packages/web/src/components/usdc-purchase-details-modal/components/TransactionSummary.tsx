import { formatUSDCWeiToUSDString } from '@audius/common'
import { USDCPurchaseDetails } from '@audius/common/models'
import BN from 'bn.js'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'

const messages = {
  cost: 'Cost of Track',
  payExtra: 'Pay Extra',
  title: 'Transaction Summary',
  total: 'Total'
}

export const TransactionSummary = ({
  transaction
}: {
  transaction: USDCPurchaseDetails
}) => {
  const amountBN = new BN(transaction.amount)
  const items: SummaryTableItem[] = [
    {
      id: 'cost',
      label: messages.cost,
      value: `$${formatUSDCWeiToUSDString(amountBN)}`
    }
  ]
  const extraAmountBN = new BN(transaction.extraAmount)
  if (!extraAmountBN.isZero()) {
    items.push({
      id: 'payExtra',
      label: messages.payExtra,
      value: `$${formatUSDCWeiToUSDString(extraAmountBN)}`
    })
  }

  return (
    <SummaryTable
      title={messages.title}
      items={items}
      summaryItem={{
        id: 'total',
        label: messages.total,
        value: `$${formatUSDCWeiToUSDString(amountBN.add(extraAmountBN))}`
      }}
    />
  )
}
