import {
  Flex,
  IconCloudUpload,
  IconComponent,
  IconHeadphones,
  IconMessage,
  Text
} from '@audius/harmony'
import { useMedia as useMediaQuery } from 'react-use'

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

type AudiusValueProps = { icon: IconComponent; text: string; dynamic?: boolean }

/**
 * Each individual audius value text + icon row
 */
const AudiusValue = (props: AudiusValueProps) => {
  const { icon: Icon, text } = props
  const isSmall = useMediaQuery(
    '(max-width: 1363px) and (min-width: 860px), (max-width: 645px)'
  )

  return (
    <Flex alignItems='center' justifyContent='center' gap='m'>
      <Icon color='staticWhite' size={isSmall ? 'l' : '2xl'} shadow='drop' />
      <Text
        variant={isSmall ? 'title' : 'heading'}
        tag='h2'
        size={isSmall ? 'l' : 'xl'}
        strength={isSmall ? 'weak' : 'default'}
        color='staticWhite'
        shadow='emphasis'
      >
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
}

export const AudiusValues = (props: AudiusValuesProps) => {
  const isMobile = useMediaQuery('(max-width: 860px)')
  const isSmall = useMediaQuery(
    '(max-width: 1363px) and (min-width: 860px), (max-width: 645px)'
  )

  return (
    <Flex
      direction='column'
      gap={isSmall ? 'l' : 'xl'}
      alignItems='center'
      p={isSmall ? 'xl' : '2xl'}
      {...props}
    >
      {isMobile ? null : (
        <Text
          variant={isSmall ? 'heading' : 'display'}
          size='s'
          strength='strong'
          color='staticWhite'
          shadow='emphasis'
        >
          {messages.heading}
        </Text>
      )}
      <AudiusValue icon={IconCloudUpload} text={messages.unlimitedStreaming} />
      <AudiusValue icon={IconMessage} text={messages.directMessages} />
      <AudiusValue icon={IconHeadphones} text={messages.adFree} />
    </Flex>
  )
}
