import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber
} from '@audius/common'
import { useUSDCBalance } from '@audius/common/hooks'
import type { BNUSDC } from '@audius/common/models'
import { Status } from '@audius/common/models'
import BN from 'bn.js'
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

export const USDCBalancePill = () => {
  const styles = useStyles()
  const { data: usdcBalance, status: usdcBalanceStatus } = useUSDCBalance()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (usdcBalance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)
  return (
    <View style={styles.root}>
      <LogoUSDC height={spacing(5)} width={spacing(5)} />
      {usdcBalanceStatus === Status.LOADING ? (
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
