import { Flex, Text, IconCrown, IconTrending } from '@audius/harmony'

const RANK_ICON_COUNT = 5

type EntityRankType = {
  index: number
}

export const EntityRank = (props: EntityRankType) => {
  const { index } = props
  const Icon = RANK_ICON_COUNT <= 5 ? IconCrown : IconTrending

  return (
    <Flex gap='xs' alignItems='center'>
      <Icon color='accent' size='s' />
      <Text size='xs' color='accent' ellipses>
        {`${index + 1}`}
      </Text>
    </Flex>
  )
}
