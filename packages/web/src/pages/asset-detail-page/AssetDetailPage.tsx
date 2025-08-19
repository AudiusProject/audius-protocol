import { useState } from 'react'

import { useArtistCoin, useWalletAddresses } from '@audius/common/api'
import { Flex, LoadingSpinner } from '@audius/harmony'
import { Redirect, useParams } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import SendTokensModal from 'components/send-tokens-modal/SendTokensModal'
import WalletModal from 'pages/audio-page/WalletModal'

import { useAssetDetailTabs } from './AssetDetailTabs'

export const AssetDetailPage = () => {
  const { mint } = useParams<{ mint: string }>()

  const {
    data: coin,
    isLoading: coinLoading,
    error: coinError
  } = useArtistCoin({ mint: mint || '' })

  if (!mint) {
    return <Redirect to='/wallet' />
  }

  if (coinLoading) {
    return (
      <Flex
        justifyContent='center'
        alignItems='center'
        css={{ minHeight: '100vh' }}
      >
        <LoadingSpinner />
      </Flex>
    )
  }

  if (coinError || !coin) {
    return <Redirect to='/wallet' />
  }

  return <AssetDetailPageContent mint={coin.mint} title={coin.ticker ?? ''} />
}

type AssetDetailPageContentProps = {
  mint: string
  title: string
}

const AssetDetailPageContent = ({
  mint,
  title
}: AssetDetailPageContentProps) => {
  const [isSendTokensModalOpen, setIsSendTokensModalOpen] = useState(false)

  // Get current wallet address
  const { data: walletAddresses } = useWalletAddresses()
  const currentWalletAddress = walletAddresses?.currentUser || ''

  const handleSendTokensModalClose = () => {
    setIsSendTokensModalOpen(false)
  }

  const openSendTokensModal = () => {
    setIsSendTokensModalOpen(true)
  }

  const { tabs, body } = useAssetDetailTabs({
    mint,
    onSend: openSendTokensModal
  })

  const header = (
    <Header primary={title} showBackButton={true} bottomBar={tabs} />
  )

  return (
    <Page title={title} header={header}>
      <WalletModal />
      <SendTokensModal
        mint={mint}
        onClose={handleSendTokensModalClose}
        walletAddress={currentWalletAddress}
        isOpen={isSendTokensModalOpen}
      />
      {body}
    </Page>
  )
}
