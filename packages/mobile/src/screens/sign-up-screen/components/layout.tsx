import { Children } from 'react'

import type { FlexProps, BoxProps } from '@audius/harmony-native'
import { Flex, Text } from '@audius/harmony-native'

type PageProps = FlexProps & {
  centered?: boolean
}

export const Page = (props: PageProps) => {
  const { centered, children, ...other } = props

  const childrenArray = Children.toArray(children)
  const footer = childrenArray.pop()

  const layoutProps: FlexProps = {
    direction: 'column',
    h: '100%',
    gap: '2xl',
    ph: 'l',
    pv: '2xl'
  }

  if (centered) {
    return (
      <Flex h='100%' direction='column' alignItems='center' {...other}>
        <Flex {...layoutProps} alignSelf='center'>
          {childrenArray}
        </Flex>
        {footer}
      </Flex>
    )
  }

  return (
    <Flex {...layoutProps} {...other}>
      {children}
    </Flex>
  )
}

type HeadingProps = {
  prefix?: any
  postfix?: any
  heading: any
  description?: any
  centered?: boolean
} & Omit<FlexProps & BoxProps, 'prefix'>

export const Heading = (props: HeadingProps) => {
  const { prefix, heading, description, postfix, centered, ...other } = props

  return (
    <Flex
      gap='s'
      direction='column'
      alignItems={centered ? 'center' : undefined}
      {...other}
    >
      {prefix}
      <Text variant='heading' color='heading' size='m'>
        {heading}
      </Text>
      {description ? (
        <Text size='m' variant='body'>
          {description}
        </Text>
      ) : undefined}
      {postfix}
    </Flex>
  )
}
