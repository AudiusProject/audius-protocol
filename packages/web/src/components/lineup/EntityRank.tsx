import { Flex, Text, IconCrown, IconTrending } from '@audius/harmony'

type EntityRankType = {
  type: 'crown' | 'trending'
  index: number
}

export const EntityRank = (props: EntityRankType) => {
  const { type, index } = props
  const Icon = type === 'crown' ? IconCrown : IconTrending

  return (
    <Flex gap='xs' alignItems='center'>
      <Icon color='accent' size='s' />
      <Text size='xs' color='accent' ellipses>
        {`${index + 1}`}
      </Text>
    </Flex>
  )
}
