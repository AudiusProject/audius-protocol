import { useCallback, useState } from 'react'

import { env } from 'process'

import useTabs from 'hooks/useTabs/useTabs'
import { AudioWalletTransactions } from 'pages/audio-page/AudioWalletTransactions'

import { AssetDetailContent } from './AssetDetailContent'

export enum AssetDetailTabType {
  HOME = 'home',
  TRANSACTIONS = 'transactions'
}

const messages = {
  home: 'Home',
  transactions: 'Transactions'
}

type UseAssetDetailTabsProps = {
  mint: string
}

export const useAssetDetailTabs = ({ mint }: UseAssetDetailTabsProps) => {
  const [selectedTab, setSelectedTab] = useState(AssetDetailTabType.HOME)

  const handleTabChange = useCallback((_from: string, to: string) => {
    setSelectedTab(to as AssetDetailTabType)
  }, [])

  const isWAudio = mint === env.WAUDIO_MINT_ADDRESS

  // For wAUDIO, show both tabs
  const tabs = [
    {
      text: messages.home,
      label: AssetDetailTabType.HOME
    },
    {
      text: messages.transactions,
      label: AssetDetailTabType.TRANSACTIONS
    }
  ]

  const tabElements = [
    <AssetDetailContent key='home' mint={mint} />,
    <AudioWalletTransactions key='transactions' />
  ]

  const tabsResult = useTabs({
    isMobile: false,
    tabs,
    selectedTabLabel: selectedTab,
    elements: tabElements,
    didChangeTabsFrom: handleTabChange
  })

  // If not wAUDIO, just return the content without tabs
  if (!isWAudio) {
    return {
      tabs: null,
      body: <AssetDetailContent mint={mint} />
    }
  }

  // For wAUDIO, return the full tabs system
  return tabsResult
}
