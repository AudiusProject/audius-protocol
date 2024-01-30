import { accountSelectors, formatWei, isNullOrUndefined } from '@audius/common'
import {
  useSelectTierInfo,
  useTotalBalanceWithFallback
} from '@audius/common/hooks'
import type { User } from '@audius/common/models'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconAudioBadge } from 'app/components/audio-rewards'
import { Text } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const { getAccountUser } = accountSelectors

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

export const AudioBalancePill = () => {
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
        height={spacing(5.5)}
        width={spacing(5.5)}
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
