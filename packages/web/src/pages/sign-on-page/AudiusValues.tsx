import { PropsWithChildren } from 'react'

import {
  Box,
  Flex,
  FlexProps,
  IconCloudUpload,
  IconComponent,
  IconHeadphones,
  IconMessage,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import { useMedia } from 'hooks/useMedia'

import styles from './AudiusValues.module.css'

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

export const ArtworkContainer = ({
  children,
  ...rest
}: PropsWithChildren<FlexProps>) => {
  const { isDesktop } = useMedia()
  return (
    <Flex
      className={cn(
        styles.artworkBackground,
        styles[isDesktop ? 'desktop' : 'mobile']
      )}
      direction='column'
      justifyContent={isDesktop ? 'center' : 'flex-start'}
      {...rest}
    >
      {children}
    </Flex>
  )
}

/**
 * Each individual audius value text + icon row
 */
type AudiusValueProps = { icon: IconComponent; text: string }
const AudiusValue = (props: AudiusValueProps) => {
  const { icon: Icon, text } = props
  const { isDesktop } = useMedia()
  return (
    <Flex alignItems='center' justifyContent='center' gap='m'>
      <Icon color='staticWhite' size={isDesktop ? '2xl' : 'l'} />
      <Text
        variant={isDesktop ? 'heading' : 'title'}
        size={isDesktop ? 'xl' : 'l'}
        strength={isDesktop ? 'default' : 'weak'}
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
  const { isDesktop } = useMedia()
  return (
    <Flex
      direction='column'
      gap={isDesktop ? 'xl' : 'l'}
      alignItems='center'
      {...props}
    >
      {isDesktop ? (
        <Box pb='l'>
          <Text
            variant='display'
            size='s'
            strength='strong'
            color='staticWhite'
            shadow='emphasis'
          >
            {messages.heading}
          </Text>
        </Box>
      ) : null}
      <AudiusValue icon={IconCloudUpload} text={messages.unlimitedStreaming} />
      <AudiusValue icon={IconMessage} text={messages.directMessages} />
      <AudiusValue icon={IconHeadphones} text={messages.adFree} />
    </Flex>
  )
}
