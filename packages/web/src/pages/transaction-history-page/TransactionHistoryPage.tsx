import { useIsMobile } from 'hooks/useIsMobile'

import { TransactionHistoryPage as DesktopTransactionHistoryPage } from './desktop/TransactionHistoryPage'
import { TransactionHistoryPage as MobileTransactionHistoryPage } from './mobile/TransactionHistoryPage'
import { TableType } from './types'

type TransactionHistoryPageProps = {
  tableView?: TableType
}

export const TransactionHistoryPage = ({
  tableView = TableType.SALES
}: TransactionHistoryPageProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileTransactionHistoryPage tableView={tableView} />
  }

  return <DesktopTransactionHistoryPage tableView={tableView} />
}
