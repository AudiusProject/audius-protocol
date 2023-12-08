import type { SvgProps } from 'react-native-svg'

import type { FlexProps } from '@audius/harmony-native'
import { Flex, Text } from '@audius/harmony-native'

import IconCloudUpload from './temp-harmony/iconCloudArrowUp.svg'
import IconHeadphones from './temp-harmony/iconHeadphones.svg'
import IconMessage from './temp-harmony/iconMessages.svg'

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

type IconComponent = React.FC<
  SvgProps & {
    fillSecondary?: string | undefined
  }
>

type AudiusValueProps = { icon: IconComponent; text: string }

/**
 * Each individual audius value text + icon row
 */
const AudiusValue = (props: AudiusValueProps) => {
  const { icon: Icon, text } = props
  return (
    <Flex alignItems='center' justifyContent='center' gap='m' direction='row'>
      <Icon color='white' height={24} width={24} />
      <Text variant='title' size='l' strength='weak' color='staticWhite'>
        {text}
      </Text>
    </Flex>
  )
}

/**
 * Renders all the audius values
 */

type AudiusValuesProps = {
  className?: string
} & FlexProps

export const AudiusValues = (props: AudiusValuesProps) => {
  return (
    <Flex direction='column' gap='l' alignItems='center' {...props}>
      <AudiusValue icon={IconCloudUpload} text={messages.unlimitedStreaming} />
      <AudiusValue icon={IconMessage} text={messages.directMessages} />
      <AudiusValue icon={IconHeadphones} text={messages.adFree} />
    </Flex>
  )
}
