import {
  coinflowModalUIActions,
  useCoinflowOnrampModal
} from '@audius/common/store'
import { useCallback, useEffect, useState } from 'react'

import { useCoinflowAdapter } from '@audius/common/hooks'
import { CoinflowPurchase } from '@coinflowlabs/react-native'
import { Transaction } from '@solana/web3.js'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconCloseAlt from 'app/assets/images/iconCloseAlt.svg'
import { AppDrawer } from 'app/components/drawer'
import { env } from 'app/env'
import { getCoinflowDeviceId } from 'app/services/coinflow'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

const MODAL_NAME = 'CoinflowOnramp'

const { ENVIRONMENT } = env
const IS_PRODUCTION = ENVIRONMENT === 'production'

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

const { transactionCanceled, transactionSucceeded } = coinflowModalUIActions

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

export const CoinflowOnrampDrawer = () => {
  const {
    data: { amount, serializedTransaction, purchaseMetadata },
    isOpen,
    onClose
  } = useCoinflowOnrampModal()
  const dispatch = useDispatch()
  const [transaction, setTransaction] = useState<Transaction | undefined>(
    undefined
  )

  const deviceId = getCoinflowDeviceId()

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
    }
  }, [serializedTransaction])

  const handleSuccess = useCallback(() => {
    dispatch(transactionSucceeded({}))
    onClose()
  }, [dispatch, onClose])

  const handleClose = useCallback(() => {
    dispatch(transactionCanceled({}))
    onClose()
  }, [dispatch, onClose])

  const showContent = isOpen && adapter

  return (
    <AppDrawer
      blockClose={false}
      drawerHeader={CoinflowOnrampDrawerHeader}
      zIndex={zIndex.COINFLOW_ONRAMP_DRAWER}
      modalName={MODAL_NAME}
      isGestureSupported={false}
      isFullscreen
      onClose={handleClose}
    >
      {showContent ? (
        <CoinflowPurchase
          deviceId={deviceId}
          transaction={transaction}
          wallet={adapter.wallet}
          chargebackProtectionData={purchaseMetadata ? [purchaseMetadata] : []}
          connection={adapter.connection}
          onSuccess={handleSuccess}
          merchantId={env.COINFLOW_MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          disableGooglePay={false}
          disableApplePay={false}
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </AppDrawer>
  )
}
