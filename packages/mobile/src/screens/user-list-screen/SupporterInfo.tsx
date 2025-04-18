import type { ID } from '@audius/common/models'
import {
  tippingSelectors,
  topSupportersUserListSelectors
} from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconTrending, IconTrophy } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { Tip } from './Tip'
const { getId: getSupportersId } = topSupportersUserListSelectors
const { getOptimisticSupporters } = tippingSelectors

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
  userId: ID
}

export const SupporterInfo = (props: SupporterInfoProps) => {
  const styles = useStyles()
  const { secondary, neutralLight4 } = useThemeColors()
  const supportersMap = useSelector(getOptimisticSupporters)
  const supportersId = useSelector(getSupportersId)
  const supportersForUser = supportersId
    ? (supportersMap[supportersId] ?? null)
    : null
  const supporter = supportersForUser?.[props.userId] ?? null

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
          weight='bold'
        >
          #{rank}
        </Text>
        {isTopRank ? (
          <Text
            style={styles.rankText}
            color={isTopRank ? 'secondary' : 'neutralLight4'}
          >
            Supporter
          </Text>
        ) : null}
      </View>
      <Tip amount={amount} />
    </View>
  )
}
