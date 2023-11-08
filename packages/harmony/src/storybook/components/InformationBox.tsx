import type { ReactNode } from 'react'

import { Unstyled } from '@storybook/blocks'

import { Flex, Link, Paper, Text } from 'components'

type InformationBoxProps = {
  className?: string
  component: ReactNode
  title: string
  description: string
  href?: string
}

export const InformationBox = (props: InformationBoxProps) => {
  const { component = null, title, description, href, className } = props

  return (
    <Paper as='section' direction='column' flex={1} gap='m'>
      <Flex
        p='xl'
        alignItems='center'
        justifyContent='center'
        className={className}
        css={(theme) => ({
          backgroundColor: theme.color.background.default,
          height: 147
        })}
      >
        <Unstyled>{component}</Unstyled>
      </Flex>
      <Flex direction='column' pv='xl' ph='l' gap='s'>
        {href ? <Link href={href}>{title}</Link> : <Text>{title}</Text>}
        <Text tag='section'>{description}</Text>
      </Flex>
    </Paper>
  )
}
