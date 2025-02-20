import { formatNumberCommas } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'

/** Renders the box containing the amount of audio to be earned from the challenge */
export const ProgressReward = ({
  amount,
  subtext
}: {
  amount?: number
  subtext: string
}) => {
  return (
    <Flex column alignItems='center'>
      <Text variant='display' color='heading' strength='strong'>
        {formatNumberCommas(amount ?? '')}
      </Text>
      <Text variant='label' size='l' color='subdued'>
        {subtext}
      </Text>
    </Flex>
  )
}
