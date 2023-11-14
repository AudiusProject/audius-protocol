import { useEffect, useState } from 'react'

import {
  deriveUserBankPubkey,
  useAppContext,
  useCoinflowOnrampModal
} from '@audius/common'
import {
  CoinflowPurchase,
  CoinflowSolanaPurchaseProps
} from '@coinflowlabs/react'
import { Connection } from '@solana/web3.js'

import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'

const MERCHANT_ID = 'audius'

type CoinflowAdapter = {
  wallet: CoinflowSolanaPurchaseProps['wallet']
  connection: Connection
}

const useCoinflowAdapter = () => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)

  useEffect(() => {
    const initWallet = async () => {
      if (!audiusBackend.audiusLibs.solanaWeb3Manager) return
      const { connection } = audiusBackend.audiusLibs.solanaWeb3Manager
      const publicKey = await deriveUserBankPubkey(audiusBackend, {
        mint: 'usdc'
      })
      setAdapter({
        connection,
        wallet: {
          publicKey,
          sendTransaction: async (transaction, connection, options) => {
            throw new Error('Method not implemented.')
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend, audiusBackend.audiusLibs.solanaWeb3Manager])

  return adapter
}

export const CoinflowOnrampModal = () => {
  const {
    data: { amount },
    isOpen,
    onClose,
    onClosed
  } = useCoinflowOnrampModal()
  const adapter = useCoinflowAdapter()

  /*
  TODO:
  - Create Transaction
  - Implement sendTransaction()
  */

  return (
    <ModalDrawer isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
      {isOpen && adapter ? (
        <CoinflowPurchase
          wallet={adapter.wallet}
          connection={adapter.connection}
          merchantId={MERCHANT_ID}
          env='sandbox'
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </ModalDrawer>
  )
}
