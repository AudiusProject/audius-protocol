import { useCallback } from 'react'

import { useCoinflowWithdrawalAdapter } from '@audius/common/hooks'
import {
  useCoinflowWithdrawModal,
  withdrawUSDCActions,
  withdrawUSDCSelectors
} from '@audius/common/store'
import { CoinflowWithdraw } from '@coinflowlabs/react-native'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconCloseAlt } from '@audius/harmony-native'
import { AppDrawer } from 'app/components/drawer'
import { env } from 'app/services/env'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

const MODAL_NAME = 'CoinflowWithdraw'

const { ENVIRONMENT } = env
const IS_PRODUCTION = ENVIRONMENT === 'production'

const { getWithdrawAmount } = withdrawUSDCSelectors
const { coinflowWithdrawalCanceled, coinflowWithdrawalSucceeded } =
  withdrawUSDCActions

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

const CoinflowWithdrawDrawerHeader = ({ onClose }: { onClose: () => void }) => {
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

export const CoinflowWithdrawDrawer = () => {
  const { isOpen, onClose, onClosed } = useCoinflowWithdrawModal()
  const amount = useSelector(getWithdrawAmount)
  const dispatch = useDispatch()

  const adapter = useCoinflowWithdrawalAdapter()

  const handleClose = useCallback(() => {
    dispatch(coinflowWithdrawalCanceled())
    onClose()
  }, [dispatch, onClose])

  const handleSuccess = useCallback(() => {
    dispatch(coinflowWithdrawalSucceeded({ transaction: '' }))
    onClose()
  }, [dispatch, onClose])

  const showContent = isOpen && adapter && amount !== undefined

  return (
    <AppDrawer
      blockClose={false}
      drawerHeader={CoinflowWithdrawDrawerHeader}
      zIndex={zIndex.COINFLOW_ONRAMP_DRAWER}
      modalName={MODAL_NAME}
      isGestureSupported={false}
      isFullscreen
      onClose={handleClose}
      onClosed={onClosed}
    >
      {showContent ? (
        <CoinflowWithdraw
          amount={amount / 100}
          lockAmount={true}
          wallet={adapter.wallet}
          connection={adapter.connection}
          onSuccess={handleSuccess}
          merchantId={env.COINFLOW_MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          blockchain='solana'
        />
      ) : null}
    </AppDrawer>
  )
}
