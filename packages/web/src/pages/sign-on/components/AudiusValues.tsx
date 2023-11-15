import React, { PropsWithChildren } from 'react'

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

/**
 *
 * @param param0
 * @returns
 */
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
const AudiusValue = (props: { icon: IconComponent; text: string }) => {
  const { icon: Icon, text } = props
  const { isDesktop } = useMedia()
  return (
    <Flex
      className={styles.valueRow}
      direction='row'
      gap='l'
      alignItems='center'
    >
      <Icon className={styles.icon} />
      <Text
        variant={isDesktop ? 'heading' : 'title'}
        size={isDesktop ? 'xl' : 'l'}
        strength={isDesktop ? 'default' : 'weak'}
      >
        {text}
      </Text>
    </Flex>
  )
}

/**
 * Renders all the audius values
 */
export const AudiusValues = () => {
  const { isDesktop } = useMedia()
  return (
    <Flex direction='column' gap={isDesktop ? 'xl' : 'l'} alignItems='center'>
      {isDesktop ? (
        <Box pb='l'>
          <Text variant='display' size='s' strength='strong'>
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
