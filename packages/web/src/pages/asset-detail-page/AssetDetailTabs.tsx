import { useCallback, useState } from 'react'

import useTabs from 'hooks/useTabs/useTabs'
import { AudioWalletTransactions } from 'pages/audio-page/AudioWalletTransactions'
import Tiers from 'pages/rewards-page/Tiers'

import { AssetDetailContent } from './AssetDetailContent'
import { AcceptedRouteKey } from './types'

export enum AssetDetailTabType {
  HOME = 'home',
  PERKS = 'perks',
  TRANSACTIONS = 'transactions'
}

const messages = {
  home: 'Home',
  perks: 'Perks',
  transactions: 'Transactions'
}

type AssetDetailTabsProps = {
  slug: AcceptedRouteKey
}

export const AssetDetailTabs = ({ slug }: AssetDetailTabsProps) => {
  const [selectedTab, setSelectedTab] = useState(AssetDetailTabType.HOME)

  const tabElements = [
    <AssetDetailContent key='home' slug={slug} />,
    <Tiers key='perks' />,
    <AudioWalletTransactions key='transactions' />
  ]

  const handleTabChange = useCallback((from: string, to: string) => {
    setSelectedTab(to as AssetDetailTabType)
  }, [])

  const { tabs, body } = useTabs({
    isMobile: false,
    tabs: [
      {
        text: messages.home,
        label: AssetDetailTabType.HOME
      },
      {
        text: messages.perks,
        label: AssetDetailTabType.PERKS
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

  return { tabs, body }
}
