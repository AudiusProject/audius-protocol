import type { BNUSDC } from '@audius/common'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useUSDCBalance
} from '@audius/common'
import BN from 'bn.js'
import { View } from 'react-native'

import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { Text } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const messages = {
  balance: 'USDC Balance'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    padding: spacing(4),
    borderColor: palette.neutralLight8,
    borderWidth: 1
  },
  text: {
    ...flexRowCentered(),
    gap: spacing(2)
  }
}))

type USDCBalanceRowProps = {
  pollingInterval?: number
}

export const USDCBalanceRow = ({
  pollingInterval = 3000
}: USDCBalanceRowProps) => {
  const styles = useStyles()
  const { data: usdcBalance } = useUSDCBalance({
    isPolling: true,
    pollingInterval
  })
  const isUsdcBalanceLoading = usdcBalance === null
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (usdcBalance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)

  return (
    <View style={styles.root}>
      <View style={styles.text}>
        <LogoUSDC height={spacing(6)} width={spacing(6)} />
        {isUsdcBalanceLoading ? (
          <Skeleton height={spacing(4.5)} width={spacing(6)} />
        ) : (
          <Text fontSize='medium' weight='bold'>
            {messages.balance}
          </Text>
        )}
      </View>
      <Text fontSize='large' weight='heavy'>
        ${usdcBalanceFormatted}
      </Text>
    </View>
  )
}
