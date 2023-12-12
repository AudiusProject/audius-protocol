import { useEffect, useState } from 'react'

import {
  deriveUserBankPubkey,
  useAppContext,
  useCoinflowOnrampModal
} from '@audius/common'
import type { CoinflowSolanaPurchaseProps } from '@coinflowlabs/react'
import { CoinflowPurchase } from '@coinflowlabs/react-native'
import type { Connection } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'
import { TouchableOpacity, View } from 'react-native'
import Config from 'react-native-config'

import IconCloseAlt from 'app/assets/images/iconCloseAlt.svg'
import { AppDrawer } from 'app/components/drawer'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

const MODAL_NAME = 'CoinflowOnramp'

const { COINFLOW_MERCHANT_ID, ENVIRONMENT } = Config
const IS_PRODUCTION = ENVIRONMENT === 'production'

type CoinflowAdapter = {
  wallet: CoinflowSolanaPurchaseProps['wallet']
  connection: Connection
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8,
    height: spacing(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing(4)
  },
  contentContainer: {
    paddingTop: spacing(6),
    flex: 1
  },
  exitContainer: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2)
  }
}))

const CoinflowOnrampDrawerHeader = ({ onClose }: { onClose: () => void }) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity activeOpacity={0.7} onPress={onClose}>
        <IconCloseAlt
          width={spacing(6)}
          height={spacing(6)}
          fill={neutralLight4}
        />
      </TouchableOpacity>
    </View>
  )
}

const useCoinflowAdapter = () => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const { connection } = libs.solanaWeb3Manager
      const publicKey = await deriveUserBankPubkey(audiusBackend, {
        mint: 'usdc'
      })
      setAdapter({
        connection,
        wallet: {
          publicKey,
          sendTransaction: async (
            transaction: any,
            connection: any,
            options: any
          ) => {
            console.debug('Sending transaction', transaction)
            return ''
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend])

  return adapter
}

export const CoinflowOnrampDrawer = () => {
  const {
    data: { amount, serializedTransaction },
    isOpen,
    onClose
  } = useCoinflowOnrampModal()
  const [transaction, setTransaction] = useState<Transaction | null>(null)

  const adapter = useCoinflowAdapter()

  useEffect(() => {
    if (serializedTransaction) {
      try {
        const deserialized = Transaction.from(
          Buffer.from(serializedTransaction, 'base64')
        )
        setTransaction(deserialized)
      } catch (e) {
        console.error(e)
      }
    } else {
      setTransaction(null)
    }
  }, [serializedTransaction])

  const showContent = isOpen && adapter && transaction

  /*
  TODO(coinflow):
  - Create Transaction
  - Implement sendTransaction()
  */

  return (
    <AppDrawer
      blockClose={false}
      drawerHeader={CoinflowOnrampDrawerHeader}
      zIndex={zIndex.COINFLOW_ONRAMP_DRAWER}
      modalName={MODAL_NAME}
      isGestureSupported={false}
      isFullscreen
      onClose={onClose}
    >
      {showContent ? (
        <CoinflowPurchase
          transaction={transaction}
          wallet={adapter.wallet}
          connection={adapter.connection}
          merchantId={COINFLOW_MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </AppDrawer>
  )
}
