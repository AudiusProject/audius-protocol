import { Status, combineStatuses, useUSDCBalance } from '@audius/common'

import Header from 'components/header/desktop/Header'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'

import styles from './PayAndEarnPage.module.css'
import { USDCCard } from './components/USDCCard'

export const messages = {
  title: 'Pay & Earn',
  description: 'Pay & earn with Audius'
}

export const PayAndEarnPage = () => {
  const statuses = []
  const { data: balance, balanceStatus } = useUSDCBalance({
    isPolling: true,
    pollingInterval: 3000
  })
  if (balance === null) {
    statuses.push(balanceStatus)
  }
  const status = combineStatuses(statuses)

  const header = <Header primary={messages.title} />

  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContainer}
      header={header}
    >
      {balance === null || status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <>
          <USDCCard balance={balance} />
        </>
      )}
    </Page>
  )
}
