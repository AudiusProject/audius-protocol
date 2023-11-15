import { useMemo } from 'react'

import type { BNWei, User } from '@audius/common'
import {
  accountSelectors,
  formatWei,
  isNullOrUndefined,
  useSelectTierInfo,
  walletSelectors
} from '@audius/common'
import BN from 'bn.js'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconAudioBadge } from 'app/components/audio-rewards'
import { Text } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const { getAccountUser } = accountSelectors
const { getAccountTotalBalance } = walletSelectors

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

/**
 * Pulls balances from account and wallet selectors. Will prefer the wallet
 * balance once it has loaded. Otherwise, will return the account balance if
 * available. Falls back to 0 if neither wallet or account balance are available.
 */
const useTotalBalanceWithFallback = () => {
  const account = useSelector(getAccountUser)
  const walletTotalBalance = useSelector(getAccountTotalBalance)

  return useMemo(() => {
    if (!isNullOrUndefined(walletTotalBalance)) {
      return walletTotalBalance
    } else if (
      !isNullOrUndefined(account) &&
      !isNullOrUndefined(account.total_balance)
    ) {
      return new BN(account.total_balance) as BNWei
    }

    return null
  }, [account, walletTotalBalance])
}

export const AudioPill = () => {
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser) as User
  const { user_id } = accountUser
  const { tier } = useSelectTierInfo(user_id)
  const audioBalance = useTotalBalanceWithFallback()
  const isAudioBalanceLoading = isNullOrUndefined(audioBalance)

  return (
    <View style={styles.root}>
      <IconAudioBadge
        tier={tier}
        showNoTier
        height={spacing(5)}
        width={spacing(5)}
      />
      {isAudioBalanceLoading ? (
        <Skeleton
          style={styles.amount}
          height={spacing(4.5)}
          width={spacing(6)}
        />
      ) : (
        <Text style={styles.amount} fontSize='small' weight='bold'>
          {formatWei(audioBalance, true, 0)}
        </Text>
      )}
    </View>
  )
}
