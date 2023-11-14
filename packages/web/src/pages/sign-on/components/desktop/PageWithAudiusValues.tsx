import React, { PropsWithChildren } from 'react'

import {
  Box,
  Flex,
  IconCloudUpload,
  IconComponent,
  IconHeadphones,
  IconMessage,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import { useMedia } from 'hooks/useMedia'

import styles from './PageWithAudiusValues.module.css'

type PageWithAudiusValuesProps = PropsWithChildren<{}>

const messages = {
  heading: 'Your Music, Your Way',
  unlimitedStreaming: 'Unlimited Streaming & Uploads',
  directMessages: 'Message & Connect With Fans',
  adFree: 'Ad-Free, Offline Listening'
}

const DesktopRootContainer = ({ children }: PropsWithChildren<{}>) => {
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

const MobileContainer = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Flex className={styles.root} direction='column' h='100%'>
      {children}
    </Flex>
  )
}

export const PageWithAudiusValues = (props: PageWithAudiusValuesProps) => {
  const { children } = props
  const { isDesktop } = useMedia()

  return isDesktop ? (
    <DesktopRootContainer>
      {children}
      <ArtworkContainer isDesktop>
        <AudiusValues isDesktop />
      </ArtworkContainer>
    </DesktopRootContainer>
  ) : (
    <MobileContainer>
      <ArtworkContainer isDesktop={false}>
        {children} <AudiusValues isDesktop={false} />
      </ArtworkContainer>
    </MobileContainer>
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

const ArtworkContainer = ({
  isDesktop,
  children
}: PropsWithChildren<{ isDesktop: boolean }>) => (
  <Flex
    className={cn(styles.valuesRoot, styles[isDesktop ? 'desktop' : 'mobile'])}
    direction='column'
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
