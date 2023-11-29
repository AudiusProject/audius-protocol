import type { ReactNode } from 'react'

import { Unstyled } from '@storybook/blocks'
import { useTheme } from '@storybook/theming'

import { Flex, Paper, Text } from 'components'

import { Link } from './Link'

type InformationBoxProps = {
  className?: string
  component: ReactNode
  title: string
  description: string
  to?: { kind: string; story: string } | { href: string }
}

export const InformationBox = (props: InformationBoxProps) => {
  const { component = null, title, description, to, className } = props
  const theme = useTheme()
  const titleCss = { fontSize: '24px !important' }

  return (
    <Paper as='section' direction='column' flex={1} pb='l'>
      <Flex
        h={144}
        ph='xl'
        alignItems='center'
        justifyContent='center'
        className={className}
        css={(theme) => ({
          backgroundColor: theme.color.background.default,
          flexGrow: 0,
          WebkitFlexGrow: 0
        })}
      >
        <Unstyled>{component}</Unstyled>
      </Flex>
      <Flex direction='column' pv='xl' ph='l' gap='s'>
        {to ? (
          <Link {...to} css={titleCss}>
            {title}
          </Link>
        ) : (
          <p css={[titleCss, { color: `${theme.color.primary} !important` }]}>
            {title}
          </p>
        )}
        <Text>{description}</Text>
      </Flex>
    </Paper>
  )
}
