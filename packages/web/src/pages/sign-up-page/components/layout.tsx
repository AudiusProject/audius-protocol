import { ComponentType, ReactNode } from 'react'

import {
  Button,
  ButtonProps,
  Flex,
  FlexProps,
  IconArrowRight,
  Text
} from '@audius/harmony'

import { useMedia } from 'hooks/useMedia'

import { ContinueFooter } from './ContinueFooter'

const messages = {
  continue: 'Continue'
}

type PageProps = FlexProps & {
  as?: ComponentType<any>
}

export const Page = (props: PageProps) => {
  const { isMobile } = useMedia()
  return (
    <Flex
      direction='column'
      h='100%'
      gap='2xl'
      ph={isMobile ? 'l' : '2xl'}
      pv='2xl'
      {...props}
    />
  )
}

type HeadingProps = {
  prefix?: ReactNode
  heading: string
  description: string
}

export const Heading = (props: HeadingProps) => {
  const { prefix, heading, description } = props
  const { isMobile } = useMedia()
  return (
    <Flex gap={isMobile ? 's' : 'l'} direction='column'>
      {prefix}
      <Text
        color='heading'
        size={isMobile ? 'm' : 'l'}
        strength='default'
        variant='heading'
      >
        {heading}
      </Text>
      <Text size={isMobile ? 'm' : 'l'} variant='body'>
        {description}
      </Text>
    </Flex>
  )
}

type PageFooterProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  buttonProps?: ButtonProps
}

export const PageFooter = (props: PageFooterProps) => {
  const { prefix, postfix, buttonProps } = props

  return (
    <ContinueFooter>
      {prefix}
      <Button
        type='submit'
        iconRight={IconArrowRight}
        fullWidth
        {...buttonProps}
      >
        {messages.continue}
      </Button>
      {postfix}
    </ContinueFooter>
  )
}
