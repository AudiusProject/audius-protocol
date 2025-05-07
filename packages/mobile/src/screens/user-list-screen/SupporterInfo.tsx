import { useSupporter } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { Flex, Text, IconTrending, IconTrophy } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'
import { useThemeColors } from 'app/utils/theme'

import { Tip } from './Tip'

type SupporterInfoProps = {
  userId: ID
}

export const SupporterInfo = (props: SupporterInfoProps) => {
  const { userId } = props
  const {
    params: { userId: supportersId }
  } = useRoute<'TopSupporters'>()

  const { secondary, neutralLight4 } = useThemeColors()
  const { data: supportFor } = useSupporter({
    userId: supportersId,
    supporterUserId: userId
  })

  const rank = supportFor?.rank
  const amount = supportFor?.amount

  const isTopRank = rank <= 5
  const RankIcon = isTopRank ? IconTrophy : IconTrending

  return (
    <Flex row justifyContent='space-between' gap='l'>
      <Flex row alignItems='center' gap='xs'>
        <RankIcon
          fill={isTopRank ? secondary : neutralLight4}
          height={15}
          width={15}
        />
        <Text size='s' color={isTopRank ? 'accent' : 'subdued'}>
          <Text strength='strong' color='inherit'>
            #{rank}
          </Text>{' '}
          {isTopRank ? 'Supporter' : null}
        </Text>
      </Flex>
      <Tip amount={amount} />
    </Flex>
  )
}
