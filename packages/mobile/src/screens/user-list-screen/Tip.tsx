import type { StringWei } from '@audius/common/models'
import { stringWeiToBN, formatWei } from '@audius/common/utils'

import { Flex, Text, IconTipping } from '@audius/harmony-native'
import { AudioText } from 'app/components/core'

type TipProps = {
  amount: StringWei
}

export const Tip = (props: TipProps) => {
  const { amount } = props

  return (
    <Flex row alignItems='center' mv='xs' gap='xs'>
      <IconTipping color='subdued' size='s' />
      <Flex row alignItems='center' gap='2xs'>
        <Text size='s' color='subdued' strength='strong'>
          {formatWei(stringWeiToBN(amount))}
        </Text>
        <AudioText fontSize='small' color='neutralLight4' />
      </Flex>
    </Flex>
  )
}
