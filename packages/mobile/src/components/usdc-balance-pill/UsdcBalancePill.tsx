import { Status, useUSDCBalance } from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import { View } from 'react-native'

import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { Text } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    ...flexRowCentered(),
    padding: spacing(0.5),
    marginLeft: spacing(4),
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    backgroundColor: palette.neutralLight10,
    borderRadius: spacing(25),
    gap: spacing(2)
  },
  amount: {
    paddingRight: spacing(1.5),
    paddingVertical: spacing(0.5)
  }
}))

export const UsdcBalancePill = () => {
  const styles = useStyles()
  const { data: usdcBalance, balanceStatus: usdcBalanceStatus } =
    useUSDCBalance({ isPolling: false })
  const isUsdcBalanceLoading =
    usdcBalance === null || usdcBalanceStatus === Status.LOADING
  const usdcBalanceFormatted = USDC(usdcBalance ?? 0).toShorthand()

  return (
    <View style={styles.root}>
      <LogoUSDC height={spacing(5)} width={spacing(5)} />
      {isUsdcBalanceLoading ? (
        <Skeleton
          style={styles.amount}
          height={spacing(4.5)}
          width={spacing(6)}
        />
      ) : (
        <Text style={styles.amount} fontSize='small' weight='bold'>
          ${usdcBalanceFormatted}
        </Text>
      )}
    </View>
  )
}
