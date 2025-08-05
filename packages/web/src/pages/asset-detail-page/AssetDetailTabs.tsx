import { useCallback, useState } from 'react'

import useTabs from 'hooks/useTabs/useTabs'
import { AudioWalletTransactions } from 'pages/audio-page/AudioWalletTransactions'

import { AssetDetailContent } from './AssetDetailContent'
import { AcceptedRouteKey } from './types'

export enum AssetDetailTabType {
  HOME = 'home',
  TRANSACTIONS = 'transactions'
}

const messages = {
  home: 'Home',
  transactions: 'Transactions'
}

type UseAssetDetailTabsProps = {
  mint: AcceptedRouteKey
}

export const useAssetDetailTabs = ({ mint }: UseAssetDetailTabsProps) => {
  const [selectedTab, setSelectedTab] = useState(AssetDetailTabType.HOME)

  const tabElements = [
    <AssetDetailContent key='home' mint={mint} />,
    <AudioWalletTransactions key='transactions' />
  ]

  const handleTabChange = useCallback((_from: string, to: string) => {
    setSelectedTab(to as AssetDetailTabType)
  }, [])

  return useTabs({
    isMobile: false,
    tabs: [
      {
        text: messages.home,
        label: AssetDetailTabType.HOME
      },
      {
        text: messages.transactions,
        label: AssetDetailTabType.TRANSACTIONS
      }
    ],
    selectedTabLabel: selectedTab,
    elements: tabElements,
    didChangeTabsFrom: handleTabChange
  })
}
