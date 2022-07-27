import type { User } from '@audius/common'
import { getOptimisticSupporters } from 'audius-client/src/common/store/tipping/selectors'
import { getId as getSupportersId } from 'audius-client/src/common/store/user-list/top-supporters/selectors'
import { View } from 'react-native'

import IconTrending from 'app/assets/images/iconTrending.svg'
import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { Text } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { Tip } from './Tip'

const useStyles = makeStyles(({ spacing, typography }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(1)
  },
  rankText: {
    marginLeft: spacing(1),
    fontSize: typography.fontSize.small
  },
  rankContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

type SupporterInfoProps = {
  user: User
}

export const SupporterInfo = (props: SupporterInfoProps) => {
  const styles = useStyles()
  const { secondary, neutralLight4 } = useThemeColors()
  const supportersMap = useSelectorWeb(getOptimisticSupporters)
  const supportersId = useSelectorWeb(getSupportersId)
  const supportersForUser = supportersId
    ? supportersMap[supportersId] ?? null
    : null
  const supporter = supportersForUser?.[props.user.user_id] ?? null

  if (!supporter) return null

  const { rank, amount } = supporter

  const isTopRank = rank <= 5
  const RankIcon = isTopRank ? IconTrophy : IconTrending

  return (
    <View style={styles.root}>
      <View style={styles.rankContainer}>
        <RankIcon
          fill={isTopRank ? secondary : neutralLight4}
          height={15}
          width={15}
        />
        <Text
          style={styles.rankText}
          color={isTopRank ? 'secondary' : 'neutralLight4'}
          weight='bold'>
          #{rank}
        </Text>
        {isTopRank ? (
          <Text
            style={styles.rankText}
            color={isTopRank ? 'secondary' : 'neutralLight4'}>
            Supporter
          </Text>
        ) : null}
      </View>
      <Tip amount={amount} />
    </View>
  )
}
