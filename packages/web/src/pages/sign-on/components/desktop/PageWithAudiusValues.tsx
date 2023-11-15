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

import styles from './PageWithAudiusValues.module.css'

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

export const SignOnContainerDesktop = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Flex
      className={styles.root}
      direction='row'
      w={1280}
      h={864}
      borderRadius='l'
      shadow='far'
    >
      {children}
    </Flex>
  )
}

export const SignOnContainerMobile = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Flex className={styles.root} direction='column' h='100%'>
      {children}
    </Flex>
  )
}
const AudiusValue = (props: {
  icon: IconComponent
  text: string
  isDesktop: boolean
}) => {
  const { icon: Icon, text, isDesktop } = props
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

export const ArtworkContainer = ({
  isDesktop,
  children,
  ...rest
}: PropsWithChildren<{ isDesktop: boolean } & FlexProps>) => (
  <Flex
    className={cn(styles.valuesRoot, styles[isDesktop ? 'desktop' : 'mobile'])}
    direction='column'
    justifyContent={isDesktop ? 'center' : 'flex-start'}
    {...rest}
  >
    {children}
  </Flex>
)

export const AudiusValues = ({ isDesktop }: { isDesktop: boolean }) => {
  return (
    <Flex direction='column' gap={isDesktop ? 'xl' : 'l'} alignItems='center'>
      {isDesktop ? (
        <Box pb='l'>
          <Text variant='display' size='s' strength='strong'>
            {messages.heading}
          </Text>
        </Box>
      ) : null}
      <AudiusValue
        icon={IconCloudUpload}
        text={messages.unlimitedStreaming}
        isDesktop={isDesktop}
      />
      <AudiusValue
        icon={IconMessage}
        text={messages.directMessages}
        isDesktop={isDesktop}
      />
      <AudiusValue
        icon={IconHeadphones}
        text={messages.adFree}
        isDesktop={isDesktop}
      />
    </Flex>
  )
}
